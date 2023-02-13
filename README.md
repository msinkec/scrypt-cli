# sCrypt CLI

A CLI tool to make development of sCrypt faster and easier.

[![Build Status](https://travis-ci.com/sCrypt-Inc/scrypt-cli.svg?branch=master)](https://travis-ci.com/sCrypt-Inc/scrypt-cli)

## Usage

### Create a new sCrypt smart contract project

```sh
npx scrypt-cli project my-proj
```
 
 or simply

```sh
npx scrypt-cli p my-proj
```

The command creates a new directory `my-proj` which contains a demo sCrypt smart contract along with needed scaffolding. 

Read the projects `README.md` for more info on how to test and deploy the generated smart contract.

You can also use the following command to generate a stateful smart contract project:

```sh
npx scrypt-cli p --state my-proj
```

Lastly, you can create an sCrypt library project with the following option:

```sh
npx scrypt-cli p --lib my-lib
```

### Install sCrypt in an existing front-end project

Currently only supports projects created by [Create React App](https://create-react-app.dev/)

```sh
npx create-react-app my-app --template typescript
cd my-app
npx scrypt-cli init
```


### Compile sCrypt smart contracts

```sh
npx scrypt-cli compile
```

This will search current project for classes extending `SmartContract` and compile them. This will produce a [contract artifact file](https://github.com/sCrypt-Inc/scryptlib#contract-description-file) for each compiled class. The files will be stored under the `scrypts` directory. 

The command needs to run in the root directory of the project.

### Publish project
```sh
npx scrypt-cli publish
```

This will check the structure of the current project and publish it on NPM.

### Get system info

When filing an issue a lot of time it's useful to provide information about your system. You can get this information with the following command:

```sh
npx scrypt-cli system
```

