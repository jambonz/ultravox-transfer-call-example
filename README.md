# Transfer an Inbound Call From Ultravox Agent to Human

This is an example Jambonz application that connects to the Ultravox Realtime API and illustrates how to build a Voice-AI application that transfers the caller from an AI agent to a human agent. The human agent receives a text-to-speech summary of the previous conversation on handoff. 

When building agents with Ultravox, you can extend your agents' capabilities by connecting them to external services and systems via [tools](https://docs.ultravox.ai/essentials/tools)—functions that agents can invoke to perform specific actions or retrieve information. These tools can be implemented as either client or server tools; we're implementing the transfer call functionality using client tools in this sample application. 
Read more about client vs server tools in the [Ultravox docs](https://docs.ultravox.ai/essentials/tools#server-vs-client-tools).

## Prerequisites

- a [jambonz.cloud](https://jambonz.cloud/) account
- an [Ultravox](https://app.ultravox.ai/) account
- a carrier and virtual phone number of your choice

## Running instructions

### Set Environment Variables

Duplicate the *examples.env* file as *.env* and fill in your credentials as shown below.

```bash
ULTRAVOX_API_KEY=eWBZ1yD3.example-UV-KEYotRQ3DlTR8a1sKVr
WS_PORT=3000

# Required for Call Transfer
HUMAN_AGENT_NUMBER=+12125551212
HUMAN_AGENT_TRUNK=MyCarrier
HUMAN_AGENT_CALLERID=+14155551000
```

| Environment Variable   | Value |
| :--------------------- | :---- |
| `ULTRAVOX_API_KEY`     | You can generate a new Ultravox API key under *Settings* in your [Ultravox account](https://app.ultravox.ai/settings/) |
| `WS_PORT`                 | The port your Express server is listening at, you can use `3000` by default. |
| `HUMAN_AGENT_NUMBER`   | The destination phone number you'd like your call to be transferred to, in international format. For example, `+12125551212`. |
| `HUMAN_AGENT_TRUNK`    | The name of your carrier of choice. |
| `HUMAN_AGENT_CALLERID` | The caller ID that shows up when transferring the call to the destination number. It will vary based on what type of caller IDs your carrier of choice allows, but using your virtual number is typically a good call. Use international format, e.g. `+14155551000`. |

### Jambonz Setup

1. Create a Carrier entity in the Jambonz portal. [See docs](https://docs.jambonz.org/guides/using-the-jambonz-portal/basic-concepts/creating-carriers).

2. Create a new Jambonz application in your portal under the [*Applications*](https://jambonz.cloud/internal/applications) tab.
Give it a name, then set both `Calling webhook` and `Call status webhook` values to the same URL: `wss://your-example-domain.ngrok.io/transfer-call`

3. After creating a carrier, you need to provision the phone number that you will be receiving calls on from that carrier. [See docs](https://docs.jambonz.org/guides/using-the-jambonz-portal/basic-concepts/creating-phone-numbers).
At the bottom of the page select the Jambonz application you just created to link your new virtual number to that application.

### Run Your App

Ensure all environment variables are properly configured before starting the application. 
Navigate to the root of this project in your terminal, then run `npm install` and `npm start`.
Call your virtual number and test it out!

## Resources

- [Ultravox Documentation](https://docs.ultravox.ai)
  - [tools](https://docs.ultravox.ai/essentials/tools) in Ultravox
- [Jambonz Documentation](https://docs.jambonz.org)
  - the ['llm'](https://docs.jambonz.org/verbs/verbs/llm) verb
  - the ['dial'](https://docs.jambonz.org/verbs/verbs/dial) verb
  - step-by-step [guides](https://docs.jambonz.org/guides/telephony-integrations) for adding carriers to Jambonz
