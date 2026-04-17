import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 3.Job Application Writer
// Nodes   : 16  |  Connections: 15
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Think                              toolThink                  [ai_tool]
// AiAgent                            agent                      [AI]
// WhenClickingExecuteWorkflow        manualTrigger
// CreatedraftEmail                   imapEnhanced               [creds]
// LoopOverItems                      splitInBatches
// Mistral                            lmChatMistralCloud         [creds] [ai_languageModel]
// If_                                if
// EditFields                         set
// If1                                if
// Save                               postgres                   [onError→regular] [creds]
// CallPrompt                         executeWorkflow
// EditFields1                        set
// Fastapi                            httpRequestTool            [ai_tool]
// GetOffersWithDescWithoutLetter     postgres                   [creds]
// Webhook                            webhook
// CaptureQueryParam                  set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenClickingExecuteWorkflow
//    → EditFields1
//      → CallPrompt
//        → GetOffersWithDescWithoutLetter
//          → LoopOverItems
//           .out(1) → If1
//              → EditFields
//                → AiAgent
//                  → Save
//                    → If_
//                      → CreatedraftEmail
//                        → LoopOverItems (↩ loop)
//                     .out(1) → LoopOverItems (↩ loop)
//             .out(1) → LoopOverItems (↩ loop)
// Webhook
//    → CaptureQueryParam
//      → EditFields1 (↩ loop)
//
// AI CONNECTIONS
// AiAgent.uses({ ai_languageModel: Mistral, ai_tool: [Think, Fastapi] })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'VKuRwjXo1SdXDOKh',
    name: '3.Job Application Writer',
    active: true,
    isArchived: false,
    tags: ['jobs'],
    settings: {
        executionOrder: 'v1',
        binaryMode: 'separate',
        timeSavedMode: 'fixed',
        saveDataSuccessExecution: 'all',
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
        saveManualExecutions: true,
    },
})
export class _3JobApplicationWriterWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '78a02e53-86a3-45b3-8e5f-45790aa92739',
        name: 'Think',
        type: '@n8n/n8n-nodes-langchain.toolThink',
        version: 1,
        position: [608, 1168],
    })
    Think = {
        description:
            'Use this tool to decompose the job offer and plan the narrative strategy. Mandatory for analyzing the required tech stack, company tone, and core responsibilities before searching the Vector Store. Use it to ensure the final application is grounded in logic and matches the specific requirements of the role without using forbidden buzzwords.',
    };

    @node({
        id: 'd3de9c59-d7bf-4b55-9659-db3b446f9bd6',
        name: 'AI Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3.1,
        position: [536, 944],
    })
    AiAgent = {
        promptType: 'define',
        text: `=# INPUT
JOB_COMPANY:{{ $json.company }}
NOW:{{ $now }}
JOB_TITLE: {{ $json.subject }}
JOB_DESCRIPTION:{{ $json.description }}

`,
        options: {
            systemMessage: "={{ $('Call \\'Prompt\\'').item.json.prompt }}",
        },
    };

    @node({
        id: 'b174299f-021b-46d6-a877-ba54e3d546cf',
        name: 'When clicking ‘Execute workflow’',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [-1088, 1360],
    })
    WhenClickingExecuteWorkflow = {};

    @node({
        id: 'fd5e2f01-e5c5-4d76-b521-1bfca932e670',
        name: 'CreateDraft email',
        type: 'n8n-nodes-imap-enhanced.imapEnhanced',
        version: 1,
        position: [1392, 1140],
        credentials: { imapApi: { id: 'PJbxZj5iTcAXhLz2', name: 'IMAP Credentials account' } },
    })
    CreatedraftEmail = {
        resource: 'email',
        operation: 'createDraft',
        destinationMailbox: {
            __rl: true,
            value: 'Entwürfe',
            mode: 'list',
            cachedResultName: 'Entwürfe',
        },
        subject: "={{ $('Edit Fields').item.json.subject }}",
        from: '={{ $json.sender_name }} <{{ $json.sender_email }}>',
        to: "={{ $('Edit Fields').item.json.email }}",
        text: '={{ $json.content }}',
    };

    @node({
        id: '552f5efa-da27-4591-90d4-0bffc264d574',
        name: 'Loop Over Items',
        type: 'n8n-nodes-base.splitInBatches',
        version: 3,
        position: [-192, 1264],
    })
    LoopOverItems = {
        options: {},
    };

    @node({
        id: '740866be-a8b2-4aba-8239-64b09a3adf07',
        name: 'Mistral',
        type: '@n8n/n8n-nodes-langchain.lmChatMistralCloud',
        version: 1,
        position: [480, 1168],
        credentials: { mistralCloudApi: { id: 'GDArvIq99nR7iVjE', name: 'Mistral Cloud account' } },
    })
    Mistral = {
        model: 'mistral-small-latest',
        options: {
            temperature: 0.2,
        },
    };

    @node({
        id: '020e4d97-df59-4646-a834-023ee7221e0a',
        name: 'If',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1168, 1068],
    })
    If_ = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'loose',
                version: 3,
            },
            conditions: [
                {
                    id: '200f1c16-a4b3-4cb6-840b-e5d5ab746495',
                    leftValue: "={{ $('Edit Fields').item.json.email }}",
                    rightValue: 'null',
                    operator: {
                        type: 'string',
                        operation: 'notEquals',
                    },
                },
            ],
            combinator: 'and',
        },
        looseTypeValidation: true,
        options: {},
    };

    @node({
        id: '304e02ee-a8a7-493a-b356-19bedde3bbc6',
        name: 'Edit Fields',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [256, 944],
    })
    EditFields = {
        assignments: {
            assignments: [
                {
                    id: '433715e5-6ff7-4a01-8bd0-220ac93892ec',
                    name: 'id',
                    value: '={{ $json.id }}',
                    type: 'number',
                },
                {
                    id: 'c36d91c2-cc1f-4286-93f3-e578ce14b347',
                    name: 'company',
                    value: '={{ $json.company }}',
                    type: 'string',
                },
                {
                    id: 'e70eb84d-2d35-4986-b245-1965b7a83191',
                    name: 'email',
                    value: '={{ $json.email }}',
                    type: 'string',
                },
                {
                    id: 'a5729bbe-f05b-407b-8728-cad3d8f79f8a',
                    name: 'company_url',
                    value: '={{ $json.company_url }}',
                    type: 'string',
                },
                {
                    id: '5f2aa5c3-ee6c-42da-93a2-75ad3d3fc6c3',
                    name: 'subject',
                    value: '=Bewerbung: {{ $json.title }}',
                    type: 'string',
                },
                {
                    id: '980cdc07-5764-469b-9343-9896096db69c',
                    name: 'description',
                    value: '={{ $json.description }}',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '1c6528c8-07c7-4072-9fb9-0922a9e9e656',
        name: 'If1',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [32, 944],
    })
    If1 = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'c02b94e3-1a1c-49b9-938f-71121a9159c6',
                    leftValue: '={{ ($json.description.match(/\\p{L}/gu) || []).length }}',
                    rightValue: 200,
                    operator: {
                        type: 'number',
                        operation: 'gte',
                    },
                },
            ],
            combinator: 'and',
        },
        looseTypeValidation: '=',
        options: {},
    };

    @node({
        id: 'c2598071-838b-47e6-8f35-a95317053523',
        name: 'Save',
        type: 'n8n-nodes-base.postgres',
        version: 2.6,
        position: [944, 944],
        credentials: { postgres: { id: 'EYfvo1U3cbPB2TYV', name: 'Postgres account' } },
        onError: 'continueRegularOutput',
    })
    Save = {
        schema: {
            __rl: true,
            mode: 'list',
            value: 'public',
        },
        table: {
            __rl: true,
            value: 'job_applications',
            mode: 'list',
            cachedResultName: 'job_applications',
        },
        columns: {
            mappingMode: 'defineBelow',
            value: {
                job_offers_id: "={{ $('Edit Fields').item.json.id }}",
                company: "={{ $('Edit Fields').item.json.company }}",
                recp_email: "={{ $('Edit Fields').item.json.email }}",
                title: "={{ $('Edit Fields').item.json.subject }}",
                content: '={{ $json.output }}',
                sender_name: "={{ $('Edit Fields1').item.json.sender_name }}",
                sender_email: "={{ $('Edit Fields1').item.json.sender_email }}",
            },
            matchingColumns: ['id'],
            schema: [
                {
                    id: 'id',
                    displayName: 'id',
                    required: false,
                    defaultMatch: true,
                    display: true,
                    type: 'number',
                    canBeUsedToMatch: true,
                    removed: true,
                },
                {
                    id: 'job_offers_id',
                    displayName: 'job_offers_id',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'number',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'sender_name',
                    displayName: 'sender_name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'sender_email',
                    displayName: 'sender_email',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'recp_name',
                    displayName: 'recp_name',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                    removed: true,
                },
                {
                    id: 'recp_email',
                    displayName: 'recp_email',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'company',
                    displayName: 'company',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'title',
                    displayName: 'title',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'content',
                    displayName: 'content',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'string',
                    canBeUsedToMatch: true,
                },
                {
                    id: 'created_at',
                    displayName: 'created_at',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    type: 'dateTime',
                    canBeUsedToMatch: true,
                    removed: true,
                },
            ],
            attemptToConvertTypes: false,
            convertFieldsToString: false,
        },
        options: {},
    };

    @node({
        id: 'c84d755d-d9c6-4f13-b878-61e26a3f2d4a',
        name: "Call 'Prompt'",
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [-640, 1264],
    })
    CallPrompt = {
        workflowId: {
            __rl: true,
            value: 'rGIluizJ8qfWnidf',
            mode: 'list',
            cachedResultUrl: '/workflow/rGIluizJ8qfWnidf',
            cachedResultName: 'Prompt',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                path: '={{ $json.path }}',
            },
            matchingColumns: ['path'],
            schema: [
                {
                    id: 'path',
                    displayName: 'path',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
            ],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {},
    };

    @node({
        id: 'b16009ee-f99b-4211-851b-191392a3bff9',
        name: 'Edit Fields1',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-864, 1264],
    })
    EditFields1 = {
        assignments: {
            assignments: [
                {
                    id: 'e07022ab-97eb-4bca-b856-666d8b89770f',
                    name: 'path',
                    value: '/home/node/.n8n-files/Prompts/jobs/writer.md',
                    type: 'string',
                },
                {
                    id: 'f70e25c3-5601-488d-b752-0be8bd2270ea',
                    name: 'sender_name',
                    value: 'Osiozekhai Aliu',
                    type: 'string',
                },
                {
                    id: '033d6ae4-becb-4798-bbaf-a5afd4fb7b4a',
                    name: 'sender_email',
                    value: 'aliu@dev-hh.de',
                    type: 'string',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '75bf4a04-fb0d-4335-a1d0-f0daa2ce5a48',
        name: 'FastAPI',
        type: 'n8n-nodes-base.httpRequestTool',
        version: 4.4,
        position: [736, 1168],
    })
    Fastapi = {
        toolDescription: 'FastAPI Endpoint for Skills and Experience on the Candidate',
        method: 'POST',
        url: 'http://api-backend:8000/api/v1/search',
        sendBody: true,
        bodyParameters: {
            parameters: [
                {
                    name: 'query',
                    value: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('parameters0_Value', ``, 'string') }}",
                },
                {
                    name: 'include_scores',
                    value: 'false',
                },
            ],
        },
        options: {},
    };

    @node({
        id: 'c71dc035-3012-4f34-a924-a4284618e034',
        name: 'Get Offers with Desc without Letter',
        type: 'n8n-nodes-base.postgres',
        version: 2.6,
        position: [-416, 1264],
        credentials: { postgres: { id: 'EYfvo1U3cbPB2TYV', name: 'Postgres account' } },
    })
    GetOffersWithDescWithoutLetter = {
        operation: 'executeQuery',
        query: `SELECT * FROM job_offers jo 
WHERE jo.id = CAST({{ $('Capture Query Param').item.json.job_offers_id }} AS integer)
  AND jo.description IS NOT NULL
  AND LENGTH(jo.description) > 200
  AND NOT EXISTS (
      SELECT 1 
      FROM job_applications ja 
      WHERE ja.job_offers_id = jo.id
  );`,
        options: {},
    };

    @node({
        id: '19457894-d199-4dfe-b980-b9fb5187df17',
        webhookId: '99bfffa2-3111-49dc-9d7b-aef87435d3c4',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-1312, 1168],
    })
    Webhook = {
        path: 'writer',
        options: {
            responseMode: 'lastNode',
            rawBody: false,
        },
    };

    @node({
        id: 'capture-query-param',
        name: 'Capture Query Param',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [-1088, 1168],
    })
    CaptureQueryParam = {
        assignments: {
            assignments: [
                {
                    id: 'job_offers_id',
                    name: 'job_offers_id',
                    value: "={{ $('Webhook').item.json.query.job_offers_id }}",
                    type: 'string',
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
        this.WhenClickingExecuteWorkflow.out(0).to(this.EditFields1.in(0));
        this.AiAgent.out(0).to(this.Save.in(0));
        this.LoopOverItems.out(1).to(this.If1.in(0));
        this.CreatedraftEmail.out(0).to(this.LoopOverItems.in(0));
        this.If_.out(0).to(this.CreatedraftEmail.in(0));
        this.If_.out(1).to(this.LoopOverItems.in(0));
        this.EditFields.out(0).to(this.AiAgent.in(0));
        this.If1.out(0).to(this.EditFields.in(0));
        this.If1.out(1).to(this.LoopOverItems.in(0));
        this.Save.out(0).to(this.If_.in(0));
        this.EditFields1.out(0).to(this.CallPrompt.in(0));
        this.CallPrompt.out(0).to(this.GetOffersWithDescWithoutLetter.in(0));
        this.GetOffersWithDescWithoutLetter.out(0).to(this.LoopOverItems.in(0));
        this.Webhook.out(0).to(this.CaptureQueryParam.in(0));
        this.CaptureQueryParam.out(0).to(this.EditFields1.in(0));

        this.AiAgent.uses({
            ai_languageModel: this.Mistral.output,
            ai_tool: [this.Think.output, this.Fastapi.output],
        });
    }
}
