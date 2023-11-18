import protobuf from "protobufjs";
import { createLightNode, createDecoder, createEncoder, waitForRemotePeer } from "@waku/sdk";


const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let node = await startUp();
const privEncoder = await listenOnPublicChannel(node, "0x234123123123123");
await sendTransactionMessage(privEncoder, Date.now(), 20)

async function startUp() {
    // Create and start a Light Node
    const node = await createLightNode({ defaultBootstrap: true });
    await node.start();

    await waitForRemotePeer(node);
    return node;
}

async function listenOnPublicChannel(node, address) {
    let privateTopic;
    const pubChatMessage = new protobuf.Type("ChatMessage")
        .add(new protobuf.Field("timestamp", 1, "uint64"))
        .add(new protobuf.Field("topic", 2, "string"));

    // Create the callback function
    const publicCallback = (wakuMessage) => {
        // Check if there is a payload on the message
        if (!wakuMessage.payload) return;
        // Render the messageObj as desired in your application
        const messageObj = pubChatMessage.decode(wakuMessage.payload);
        console.log("setting priv topics")
        privateTopic = messageObj.topic
        console.log("In the callback: ", privateTopic)
        console.log(messageObj);
    };

    // Create a filter subscription
    const subscription = await node.filter.createSubscription();

    // Setup decoder with correct contentTopic
    const publicTopic = "/public/merchant/" + address;
    const pubDecoder = createDecoder(publicTopic);

    // Subscribe to content topics and process new messages
    await subscription.subscribe([pubDecoder], publicCallback);

    //to stop this sub
    // await subscription.unsubscribe([contentTopic]);

    // console.log("PRIVY TOPIC", privateTopic)
    while (privateTopic == undefined) {
        console.log("we wait...")
        await sleep(1000);
    }
    const privEncoder = createEncoder({ contentTopic: privateTopic });
    return privEncoder
}

async function sendTransactionMessage(privEncoder, timestamp, value) {
    //NOW SEND TRANSACTON INFO BACK ON PRIV CHANNEL
    const msgType = new protobuf.Type("ChatMessage")
        .add(new protobuf.Field("timestamp", 1, "uint64"))
        .add(new protobuf.Field("value", 2, "uint64"))

    // Create a new message object
    const transactionData = msgType.create({
        timestamp,
        value,
    });

    const serialisedMsg = msgType.encode(transactionData).finish();

    // Send the message containing transaction info to the customer on new priv channel
    await node.lightPush.send(privEncoder, {
        payload: serialisedMsg,
    });

    console.log("Merchant sent back transaction info")
}