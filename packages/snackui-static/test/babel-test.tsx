import '@dish/react-test-env/jsdom-register'

import path from 'path'

import anyTest, { TestInterface } from 'ava'
import React from 'react'
import webpack from 'webpack'

import { externalizeModules } from './lib/externalizeModules'
import { extractBabel } from './lib/extract'
import { outDir, specDir } from './lib/test-constants'
import { testStyles } from './lib/testStyles'

const outFile = 'out-babel.js'
const outFileFull = path.join(outDir, outFile)

window['React'] = React
process.env.NODE_ENV = 'test'

export const test = anyTest as TestInterface<{
  app: any
}>

test.before(async (t) => {
  await extractStaticApp()
  process.env.IS_STATIC = undefined
  t.context.app = require(outFileFull)
})

//
// test styles
//
testStyles(test)

test('basic extraction', async (t) => {
  const output = extractBabel(`
import { VStack } from 'snackui'

export function Test() {
  return (
    <VStack backgroundColor="red" />
  )
}
  `)
  const code = output?.code ?? ''
  t.assert(code.includes(`"backgroundColor": "red"`))
  t.assert(code.includes(`ReactNativeStyleSheet.create`))
})

test('basic conditional extraction', async (t) => {
  const output = extractBabel(`
import { VStack } from 'snackui'

export function Test() {
  return (
    <>
      <VStack backgroundColor={x ? 'red' : 'blue'} />
      <VStack {...x && { backgroundColor: 'red' }} />
    </>
  )
}
  `)
  const code = output?.code ?? ''
  t.assert(code.includes(`_sheet["0"], x ? _sheet["1"] : _sheet["2"]`))
  t.assert(code.includes(`_sheet["3"], x ? _sheet["4"] : _sheet["5"]`))
})

async function extractStaticApp() {
  const compiler = webpack({
    context: specDir,
    mode: 'production',
    devtool: false,
    optimization: {
      minimize: false,
      concatenateModules: false,
      splitChunks: false,
    },
    entry: path.join(specDir, 'extract-specs.tsx'),
    output: {
      libraryTarget: 'commonjs',
      filename: outFile,
      path: outDir,
    },
    externals: [externalizeModules],
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      mainFields: ['tsmain', 'browser', 'module', 'main'],
      alias: {
        'react-native': 'react-native-web',
      },
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                // add our plugin
                plugins: [require.resolve('@snackui/babel-plugin')],
                presets: [require.resolve('@dish/babel-preset')],
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.DEBUG': JSON.stringify(process.env.DEBUG ?? ''),
        'process.env.SNACKUI_COMPILE_PROCESS': JSON.stringify(1),
      }),
    ],
  })

  await new Promise<void>((res) => {
    compiler.run((err, result) => {
      console.log({ err })
      console.log(result?.toString())
      res()
    })
  })
}
