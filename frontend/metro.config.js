const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Allow Metro to bundle .svg assets.
config.resolver.assetExts = [...config.resolver.assetExts, 'svg']

module.exports = config
