module.exports = {
    transformer: {
        assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    },
    resolver: {
        extraNodeModules: {
            stream: require.resolve('stream-browserify'),
        },
    },
};