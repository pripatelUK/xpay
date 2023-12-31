import {
    defaultPubsubTopic,
    newNode,
    start,
    isStarted,
    stop,
    peerID,
    relayEnoughPeers,
    listenAddresses,
    connect,
    peerCnt,
    peers,
    relayPublish,
    relayUnsubscribe,
    relaySubscribe,
    WakuMessage,
    onMessage,
    StoreQuery,
    storeQuery,
    Config,
    FilterSubscription,
    ContentFilter,
    filterSubscribe,
    dnsDiscovery,
} from '@waku/react-native';


export async function startNode() {
    const nodeStarted = await isStarted();

    if (!nodeStarted) {
        await newNode(null);
        await start();

        await relaySubscribe();
        await connectPeers();
    }
    console.log('The node ID:', await peerID());
}

export async function connectPeers() {
    // if (enough) {
    //     console.log("already connected!")
    //     return
    // }

    try {
        await connect(
            '/dns4/node-01.ac-cn-hongkong-c.wakuv2.test.statusim.net/tcp/30303/p2p/16Uiu2HAkvWiyFsgRhuJEb9JfjYxEkoHLgnUQmr1N5mKWnYjxYRVm',
            5000
        );
    } catch (err) {
        console.log('Could not connect to peers');
    }

    try {
        await connect(
            '/dns4/node-01.do-ams3.wakuv2.test.statusim.net/tcp/30303/p2p/16Uiu2HAmPLe7Mzm8TsYUubgCAW1aJoeFScxrLj8ppHFivPo97bUZ',
            5000
        );
    } catch (err) {
        console.log('Could not connect to peers');
    }
    console.log('connected!');

    // DNS Discovery
    console.log('Retrieving Nodes using DNS Discovery');
    const dnsDiscoveryResult = await dnsDiscovery(
        'enrtree://AO47IDOLBKH72HIZZOXQP6NMRESAN7CHYWIBNXDXWRJRZWLODKII6@test.wakuv2.nodes.status.im',
        '1.1.1.1'
    );
    console.log(dnsDiscoveryResult);
}

export async function sendMessage(myContentTopic, str) {
    await startNode();

    await connectPeers();

    // console.log('PeerCNT', await peerCnt());
    // console.log('Peers', await peers());

    let msg = new WakuMessage();
    msg.contentTopic = myContentTopic;
    // msg.payload = new Uint8Array([1, 2, 3, 4, 5]);
    msg.payload = new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
    msg.timestamp = new Date();
    msg.version = 0;

    let messageID = await relayPublish(msg);
    console.log('The messageID', messageID);
}

export function formatMessage(obj) {
    let data = JSON.parse(obj);
    return String.fromCharCode.apply(null, data.data);
}