// Additional example code
// https://github.com/waku-org/js-waku-examples/blob/master/examples/light-chat/index.js
import { createLightNode, waitForRemotePeer, createEncoder, createDecoder } from "@waku/sdk";
import protobuf from "protobufjs";

let privateTopic = "/sweet/honey/badger";
let privateValue;

// Create and start a Light Node
const node = await createLightNode({ defaultBootstrap: true });
await node.start();

// Use the stop() function to stop a running node
// await node.stop();

// Wait for a successful peer connection
await waitForRemotePeer(node);
const subscription = await node.filter.createSubscription();

// Choose a content topic
const contentTopic = "/public/merchant/channel";

// Create a message encoder and decoder
//@note we can have the msgs stored if we also pass encoder ephemeral: true
const encoder = createEncoder({ contentTopic });

// Create a message structure using Protobuf
const pubChatMessage = new protobuf.Type("ChatMessage")
    .add(new protobuf.Field("timestamp", 1, "uint64"))
    .add(new protobuf.Field("topic", 2, "string"));

// Create a new message object
const protoMessage = pubChatMessage.create({
    timestamp: Date.now(),
    topic: privateTopic, //this must be randomly generated
});

// Serialise the message using Protobuf
const serialisedMessage = pubChatMessage.encode(protoMessage).finish();

// Send the message containing the private channel topic to the merchant
await node.lightPush.send(encoder, {
    payload: serialisedMessage,
});

console.log("Private Channel Message Has Been Sent on Pub Chat!")

// const decoder = createDecoder(contentTopic);

// // Create the callback function
// const callback = (wakuMessage) => {
//     // Check if there is a payload on the message
//     if (!wakuMessage.payload) return;
//     // Render the messageObj as desired in your application
//     const messageObj = ChatMessage.decode(wakuMessage.payload);
//     privateTopic = messageObj.channel
//     console.log(messageObj);
// };

// Subscribe to content topics and process new messages
// await subscription.subscribe([decoder], callback);

//SUB TO PRIV CHANNEL
const privDecoder = createDecoder(privateTopic);

const msgType = new protobuf.Type("ChatMessage")
    .add(new protobuf.Field("timestamp", 1, "uint64"))
    .add(new protobuf.Field("value", 2, "uint64"))

// Create the callback function
const privCallback = (wakuMessage) => {
    // Check if there is a payload on the message
    if (!wakuMessage.payload) return;
    // Render the messageObj as desired in your application
    const messageObj = msgType.decode(wakuMessage.payload);
    privateValue = messageObj.value
    console.log(messageObj);
};

// Subscribe to content topics and process new messages
await subscription.subscribe([privDecoder], privCallback);
console.log("listening for merchant tx info...")