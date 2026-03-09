#!/usr/bin/env python3
"""Tiny TCP forwarder.

Used to expose Chromium DevTools (which is loopback-bound in this image)
to 0.0.0.0 so Docker port mapping works.

Listens on LISTEN_HOST:LISTEN_PORT and forwards to TARGET_HOST:TARGET_PORT.
"""

import os
import socket
import threading


LISTEN_HOST = os.environ.get("LISTEN_HOST", "0.0.0.0")
LISTEN_PORT = int(os.environ.get("LISTEN_PORT", "9222"))
TARGET_HOST = os.environ.get("TARGET_HOST", "127.0.0.1")
TARGET_PORT = int(os.environ.get("TARGET_PORT", "9223"))


def pipe(src: socket.socket, dst: socket.socket) -> None:
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        # Best-effort: connections are short lived; just close.
        pass
    finally:
        try:
            dst.shutdown(socket.SHUT_RDWR)
        except Exception:
            pass
        try:
            src.shutdown(socket.SHUT_RDWR)
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass
        try:
            src.close()
        except Exception:
            pass


def handle(client: socket.socket, client_addr) -> None:
    # Chromium might not be ready yet (container just started). Retry briefly.
    upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    last_err: Exception | None = None
    for _ in range(50):  # ~5s total
        try:
            upstream.connect((TARGET_HOST, TARGET_PORT))
            last_err = None
            break
        except Exception as e:  # noqa: BLE001
            last_err = e
            try:
                upstream.close()
            except Exception:
                pass
            upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # 100ms backoff
            threading.Event().wait(0.1)

    if last_err is not None:
        try:
            client.close()
        except Exception:
            pass
        return
    t1 = threading.Thread(target=pipe, args=(client, upstream), daemon=True)
    t2 = threading.Thread(target=pipe, args=(upstream, client), daemon=True)
    t1.start()
    t2.start()
    t1.join()
    t2.join()


def main() -> None:
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((LISTEN_HOST, LISTEN_PORT))
    srv.listen(128)
    while True:
        client, addr = srv.accept()
        threading.Thread(target=handle, args=(client, addr), daemon=True).start()


if __name__ == "__main__":
    main()
