import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 2.Job Offers Research
// Nodes   : 17  |  Connections: 19
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Loop                               splitInBatches
// AddProcessToOutput                 code
// WhenClickingExecuteWorkflow        manualTrigger
// EditFields                         set
// Setappvars                         set
// Wait                               wait
// OffersResearch                     postgres                   [creds]
// SubmitCrawlJob                     httpRequest
// CheckCrawlStatus                   httpRequest
// IsCompleted                        if
// Json                               code
// CallJobOffersStore                 executeWorkflow
// Wait30Seconds                      wait
// InitRetryCount                     set
// WaitRetry                          wait
// MaxRetriesExceeded                 if
// IncrementRetry                     set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenClickingExecuteWorkflow
//    → Setappvars
//      → OffersResearch
//        → Loop
//          → AddProcessToOutput
//            → CallJobOffersStore
//         .out(1) → EditFields
//            → SubmitCrawlJob
//              → InitRetryCount
//                → Wait30Seconds
//                  → CheckCrawlStatus
//                    → IsCompleted
//                      → Json
//                        → Wait
//                          → Loop (↩ loop)
//                     .out(1) → MaxRetriesExceeded
//                        → IncrementRetry
//                          → WaitRetry
//                            → CheckCrawlStatus (↩ loop)
//                       .out(1) → Loop (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '7rn4CkbMSPEFJsZ7',
    name: '2.Job Offers Research',
    active: false,
    tags: ['jobs'],
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        availableInMCP: false,
        callerPolicy: 'workflowsFromSameOwner',
    },
})
export class _2JobOffersResearchWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '3204a125-62a8-4c05-8963-4c3c0c90ac33',
        name: 'Loop',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [-224, 272],
    })
    Loop = {
        options: {},
    };

    @node({
        id: '98dd0b4d-65fe-4d49-9e1b-dc5fdb572657',
        name: 'Add Process To Output',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [0, 0],
    })
    AddProcessToOutput = {
        jsCode: `return $input.all().map(item => {
  item.json.process = "Research";
  return item;
});`,
    };

    @node({
        id: 'f71ba3ad-3e09-499d-9da7-bb7c30f966d1',
        name: "When clicking 'Execute workflow'",
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [-896, 272],
    })
    WhenClickingExecuteWorkflow = {};

    @node({
        id: '17f9cd10-83c7-4d54-9f9d-ab9a6515d052',
        name: 'Edit Fields',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [0, 192],
    })
    EditFields = {
        assignments: {
            assignments: [
                {
                    id: '092cf582-7844-4e7c-a556-441f14fba081',
                    name: 'cookie',
                    type: 'string',
                    value: "={{ $json.url.toLowerCase().includes('xing') ? 'NDIzNTIwOCM0MjM1MjA4LTVndGtINWxpbzZ0eHBQVlFPNU5rcU9OS2w0T1JJ%0ARmdldHc2RXJQOERkODA%3D--cd29b17cf7a4401c480948396f7addecd02df608' : ($json.url.toLowerCase().includes('linkedin') ? 'AQEDASub8JgETdCCAAABnPDDiYwAAAGdFNANjE4AS74fJghJTHFQqEE9MMAPndgUyEajJTNsxA9hxtV0B1FBzOfqGxvOz4HDH9z8oj-IhdrIHh8XDToy5iwypSS6I9gXFNPIsVOatH55C8YTH4muMp7O' : ($json.url.toLowerCase().includes('indeed') ? 'indeed key' : '')) }}",
                },
                {
                    id: '0a859ddd-9433-43ca-99d5-7a7ca8429156',
                    name: 'domain',
                    type: 'string',
                    value: "={{ $json.url.toLowerCase().includes('xing') ? 'www.xing.com' : ($json.url.toLowerCase().includes('linkedin') ? 'www.linkedin.com' : ($json.url.toLowerCase().includes('indeed') ? 'www.indeed.com' : '')) }}",
                },
                {
                    id: '2da2b25a-f151-47a1-aab3-63302b395db9',
                    name: 'url',
                    type: 'string',
                    value: '={{ $json.url }}',
                },
                {
                    id: 'ceb26aa7-9766-449b-a112-2faa4d38c34d',
                    name: 'cookie_name',
                    type: 'string',
                    value: "={{ $json.url.toLowerCase().includes('xing') ? 'login' : ($json.url.toLowerCase().includes('linkedin') ? 'li_at' : ($json.url.toLowerCase().includes('indeed') ? 'www.indeed.com' : '')) }}",
                },
            ],
        },
        options: {},
    };

    @node({
        id: '6d055684-42ea-4c73-b15d-edc3a6f14b0e',
        name: 'SetAppVars',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-672, 272],
    })
    Setappvars = {
        assignments: {
            assignments: [
                {
                    id: 'e07022ab-97eb-4bca-b856-666d8b89770f',
                    name: 'path',
                    type: 'string',
                    value: '/home/node/.n8n-files/Prompts/jobs/research.md',
                },
                {
                    id: '83114999-2145-4d88-bde7-0a368b3eab79',
                    name: 'mistral_api_key',
                    type: 'string',
                    value: 'pF8g3Q7cIt8flY3SDcu6kc6TwXWGiGhJ',
                },
                {
                    id: 'be33fa53-d699-4633-ba84-55c4d36c4ecd',
                    name: 'zai_api_key',
                    type: 'string',
                    value: '0a3b138ea62943b5835e9d6650be5a32.W8zS4LhkdCNAxQpb',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'b1e09311-82ce-41af-9808-d4d4c0f95aa5',
        webhookId: '9902db1a-63ba-4996-afb1-bcf1f0c614e1',
        name: 'Wait',
        type: 'n8n-nodes-base.wait',
        version: 1.1,
        position: [1344, 336],
    })
    Wait = {
        amount: '={{ Math.floor(Math.random() * 30) + 1 }}',
    };

    @node({
        id: '400f685f-dde6-46ed-abdf-2f245b749c97',
        name: 'Offers Research',
        type: 'n8n-nodes-base.postgres',
        version: 2.6,
        position: [-448, 272],
        credentials: { postgres: { id: 'xXZFV04TJNvIxMUn', name: 'Postgres account' } },
        retryOnFail: false,
        waitBetweenTries: 5000,
    })
    OffersResearch = {
        operation: 'executeQuery',
        schema: {
            mode: 'name',
            value: 'public',
        },
        table: {
            mode: 'name',
            value: 'job_offers',
        },
        query: `SELECT 
	jo.id,
    jo.title,
    jo.url
FROM 
	job_offers jo
WHERE 
	id 
IN(
	SELECT 
		jop.job_offers_id 
	from
		job_offers_process jop 
	where
		jop.research = false
)
;`,
        options: {},
    };

    @node({
        id: '5b124b8c-c407-47da-baa7-9c6a3b654f4d',
        name: 'Submit Crawl Job',
        type: 'n8n-nodes-base.httpRequest',
        version: 4,
        position: [224, 192],
    })
    SubmitCrawlJob = {
        method: 'POST',
        url: 'http://crawl4ai:11235/crawl/job',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={
  "urls": [
    "{{$json.url}}"
  ],
  "browser_config": {
    "headless": true,
    "enable_stealth": true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://www.google.com/"
    },
    "cookies": [
      {
        "name": "{{$json.cookie_name}}",
        "value": "{{$json.cookie}}",
        "domain": "{{$json.domain}}",
        "path": "/",
        "secure": true
      }
    ]
  },
  "crawler_config": {
    "magic": true,
    "cache_mode": "bypass",
    "wait_until": "networkidle",
    "wait_for": "css:div[data-testid='expandable-content']",
    "page_timeout": 40000,
    "remove_overlay_elements": true,
    "verbose": true,
    "js_code": [
      "await window.scrollTo(0, document.body.scrollHeight / 2)",
      "await new Promise(r => setTimeout(r, 2000))",
      "await window.scrollTo(0, document.body.scrollHeight)"
    ]
  }
}`,
        options: {},
    };

    @node({
        id: '1c45380d-9ddd-4af0-8c1a-f583fa58115a',
        name: 'Check Crawl Status',
        type: 'n8n-nodes-base.httpRequest',
        version: 4,
        position: [672, 192],
    })
    CheckCrawlStatus = {
        url: '=http://crawl4ai:11235/crawl/job/{{$json["task_id"]}}',
        options: {},
    };

    @node({
        id: '007a697c-760c-4dd7-b8e1-fa8a1fbedc2c',
        name: 'Is Completed?',
        type: 'n8n-nodes-base.if',
        version: 1,
        position: [896, 272],
    })
    IsCompleted = {
        conditions: {
            string: [
                {
                    value1: '={{$json["status"]}}',
                    value2: 'completed',
                },
            ],
        },
    };

    @node({
        id: '25d5e644-6998-4472-8032-d73508e491ba',
        name: 'JSON',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1120, 272],
    })
    Json = {
        jsCode: `return [
  {
    "id": $('Loop').first().json.id,
    "title": $('Loop').first().json.title,
    "description": $input.first().json.results[0].markdown.raw_markdown
  }
]`,
    };

    @node({
        id: '7b620da0-7c13-474c-99fb-2b009316c363',
        name: "Call 'Job Offers - store'",
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [224, 0],
    })
    CallJobOffersStore = {
        workflowId: {
            __rl: true,
            value: 'LFBN3AxcJBAJvo9R',
            mode: 'list',
            cachedResultUrl: '/workflow/LFBN3AxcJBAJvo9R',
            cachedResultName: 'Job Offers - store',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {},
            matchingColumns: [],
            schema: [],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {},
    };

    @node({
        id: 'cd7a9fa3-b35b-4121-9293-15c7f1d74560',
        webhookId: 'b24b87df-49d0-468d-bf23-4587689f61fe',
        name: 'Wait 30 Seconds',
        type: 'n8n-nodes-base.wait',
        version: 1,
        position: [448, 192],
    })
    Wait30Seconds = {
        amount: 30,
        unit: 'seconds',
    };

    @node({
        id: 'a1b2c3d4-1234-5678-9abc-def012345678',
        name: 'Init Retry Count',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [336, 192],
    })
    InitRetryCount = {
        assignments: {
            assignments: [
                {
                    id: 'retry-count-001',
                    name: 'retry_count',
                    type: 'number',
                    value: '={{ 0 }}',
                },
                {
                    id: 'retry-task-id',
                    name: 'task_id',
                    type: 'string',
                    value: '={{ $json.task_id }}',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'e5f6g7h8-1234-5678-9abc-def012345679',
        webhookId: 'w8i9j0k1-2345-6789-abcd-ef012345678a',
        name: 'Wait Retry',
        type: 'n8n-nodes-base.wait',
        version: 1,
        position: [1100, 450],
    })
    WaitRetry = {
        amount: 30,
        unit: 'seconds',
    };

    @node({
        id: 'l2m3n4o5-3456-789a-bcde-f0123456789b',
        name: 'Max Retries Exceeded?',
        type: 'n8n-nodes-base.if',
        version: 1,
        position: [1000, 400],
    })
    MaxRetriesExceeded = {
        conditions: {
            number: [
                {
                    value1: '={{ $json.retry_count }}',
                    operation: 'smaller',
                    value2: 5,
                },
            ],
        },
    };

    @node({
        id: 'p6q7r8s9-4567-89ab-cdef-0123456789c',
        name: 'Increment Retry',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1100, 550],
    })
    IncrementRetry = {
        assignments: {
            assignments: [
                {
                    id: 'incr-retry-001',
                    name: 'retry_count',
                    type: 'number',
                    value: '={{ $json.retry_count + 1 }}',
                },
                {
                    id: 'keep-task-id',
                    name: 'task_id',
                    type: 'string',
                    value: '={{ $json.task_id }}',
                },
            ],
        },
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WhenClickingExecuteWorkflow.out(0).to(this.Setappvars.in(0));
        this.Setappvars.out(0).to(this.OffersResearch.in(0));
        this.OffersResearch.out(0).to(this.Loop.in(0));
        this.Loop.out(0).to(this.AddProcessToOutput.in(0));
        this.Loop.out(1).to(this.EditFields.in(0));
        this.AddProcessToOutput.out(0).to(this.CallJobOffersStore.in(0));
        this.EditFields.out(0).to(this.SubmitCrawlJob.in(0));
        this.SubmitCrawlJob.out(0).to(this.InitRetryCount.in(0));
        this.InitRetryCount.out(0).to(this.Wait30Seconds.in(0));
        this.Wait30Seconds.out(0).to(this.CheckCrawlStatus.in(0));
        this.CheckCrawlStatus.out(0).to(this.IsCompleted.in(0));
        this.IsCompleted.out(0).to(this.Json.in(0));
        this.IsCompleted.out(1).to(this.MaxRetriesExceeded.in(0));
        this.Json.out(0).to(this.Wait.in(0));
        this.Wait.out(0).to(this.Loop.in(0));
        this.MaxRetriesExceeded.out(0).to(this.IncrementRetry.in(0));
        this.MaxRetriesExceeded.out(1).to(this.Loop.in(0));
        this.IncrementRetry.out(0).to(this.WaitRetry.in(0));
        this.WaitRetry.out(0).to(this.CheckCrawlStatus.in(0));
    }
}
