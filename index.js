require('dotenv').config();
const {createServer} = require('http');
const {createEndpoint} = require('@jambonz/node-client-ws');
const server = createServer();
const makeService = createEndpoint({server});
const logger = require('pino')({level: process.env.LOGLEVEL || 'info'});
const port = process.env.WS_PORT || 3000;


const service = ({logger, makeService}) => {
    const svc = makeService({path: '/transfer-call'});
  
    svc.on('session:new', (session) => {

        session.locals = {logger: logger.child({call_sid: session.call_sid})};
        logger.info({session}, `new incoming call: ${session.call_sid}`);
  
        const apiKey = process.env.ULTRAVOX_API_KEY;
  
        try {
            session
                .on('/event', onEvent.bind(null, session))
                .on('/final', onFinal.bind(null, session))
                .on('close', onClose.bind(null, session))
                .on('error', onError.bind(null, session))
                .on('/toolCall', onToolCall.bind(null, session))
                .on('/dialAction', dialAction.bind(null, session))
                .on('/confirmAction', confirmAction.bind(null, session));
        
            session
                .answer()
                .pause({length: 1.5})
                .llm({
                    vendor: 'ultravox',
                    model: 'fixie-ai/ultravox',
                    auth: {
                        apiKey
                    },
                    actionHook: '/final',
                    eventHook: '/event',
                    toolHook: '/toolCall',
                    llmOptions: {
                        systemPrompt: 'You are an agent named Karen. You can help the caller with simple questions or transfer them to a human agent. Be brief. When you call the tool to transfer the call provide a brief summary of the call with the user so far.',
                        firstSpeaker: 'FIRST_SPEAKER_AGENT',
                        initialMessages: [{
                            medium: 'MESSAGE_MEDIUM_VOICE',
                            role: 'MESSAGE_ROLE_USER'
                        }],
                        model: 'fixie-ai/ultravox',
                        voice: 'Tanya-English',
                        transcriptOptional: true,
                        selectedTools: [
                            {
                                temporaryTool: {
                                    modelToolName: 'call-transfer',
                                    description: 'Transfers the call to a human agent',
                                    dynamicParameters: [
                                        {
                                          name: 'conversationSummary',
                                          location: 'PARAMETER_LOCATION_BODY',
                                          schema: {
                                            type: 'string',
                                            description: 'A summary of the conversation so far'
                                          },
                                          required: true
                                        }
                                      ],
                                    client: {}
                                }
                            }
                        ],
                    }
                })
                .hangup()
                .send();

        } catch (err) {
          session.locals.logger.info({err}, `Error to responding to incoming call: ${session.call_sid}`);
          session.close();
        }
    });
};

const onEvent = async(session, evt) => {
    const {logger} = session.locals;
    logger.info(`got eventHook: ${JSON.stringify(evt)}`);
};

const onFinal = async(session, evt) => {
    const {logger} = session.locals;
    logger.info(`got actionHook: ${JSON.stringify(evt)}`);

    if (['server failure', 'server error'].includes(evt.completion_reason)) {
        if (evt.error.code === 'rate_limit_exceeded') {
            let text = 'Sorry, you have exceeded your  rate limits. ';
            const arr = /try again in (\d+)/.exec(evt.error.message);
            if (arr) {
                text += `Please try again in ${arr[1]} seconds.`;
            }
            session
                .say({text});
        }
        else {
            session
                .say({text: 'Sorry, there was an error processing your request.'});
        }
        session.hangup();
    }
    session.reply();
};

const onClose = (session, code, reason) => {
    const {logger} = session.locals;
    logger.info({session, code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
    const {logger} = session.locals;
    logger.info({err}, `session ${session.call_sid} received error`);
};

const onToolCall = async(session, evt) => {
    const {logger} = session.locals;
    const {name, args, tool_call_id} = evt;
    const {conversation_summary} = args;
    logger.info({evt}, `got toolHook for ${name} with tool_call_id ${tool_call_id}`);

    session.locals.conversation_summary = conversation_summary;

    try {
        const data = {
            type: 'client_tool_result',
            invocation_id: tool_call_id,
            result: "Successfully transferred call to agent, telling user to wait for a moment.",
        };
    
        setTimeout(() => {
            session.sendCommand('redirect', [
                {
                    verb: 'say',
                    text: 'Please wait while I connect your call'
                },
                {
                    verb: 'dial',
                    actionHook: '/dialAction',
                    confirmHook: '/confirmAction',
                    callerId: process.env.HUMAN_AGENT_CALLERID,
                    target: [
                        {
                            type: 'phone',
                            number: process.env.HUMAN_AGENT_NUMBER,
                            trunk: process.env.HUMAN_AGENT_TRUNK
                        }
                    ]
                }
            ]);
        }, 5000);
    
        session.sendToolOutput(tool_call_id, data);
  
    } catch (err) {
        logger.info({err}, 'error transferring call');
        const data = {
            type: 'client_tool_result',
            invocation_id: tool_call_id,
            error_message: 'Failed to transfer call'
        };
        session.sendToolOutput(tool_call_id, data);
    }
};

const dialAction = async(session, evt) => {
    const {logger} = session.locals;
    logger.info(`dialAction: `);
    console.log(evt);
    session
        .say({text: "The call with a human agent has ended"})
        .hangup()
        .reply();
}

const confirmAction = async(session, evt) => {
    conversation_summary = session.locals.conversation_summary;
    logger.info(`Summary: ${conversation_summary}`);

    session
        .pause({length: 1})
        .say({text: "The summary of the conversation so far is: " + conversation_summary})
        .reply();
}



module.exports = service;
service({logger, makeService});  

server.listen(port, () => {
    logger.info(`jambonz websocket server listening at http://localhost:${port}`);
});