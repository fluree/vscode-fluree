# Fluree: Beyond the Database

Build better applications with a tamper-proof blockchain ledger, semantic graph query engine, linearly scalable query edge servers, and co-resident data security

## Download

To download the extension, search the VS Code Extension: Marketplace for `Fluree: Beta` or [download here](https://marketplace.visualstudio.com/items?itemName=Fluree.fluree).

## Extension 

Welcome to the `Fluree` VS Code extension. This extension connects to a single Fluree database, and allows you to issue queries, transaction, and tests against that database. 

Please note this is a beta version of the Fluree extension. Any issues and feature ideas can be sent to support@flur.ee. You can also join our [Slack channel](https://join.slack.com/t/flureedb/shared_invite/enQtNTM1NzI4MTEzODA4LWEzNTMzN2VmYjBiODQ5MDUzODg1M2E3OTBjNGVmM2EwNmZhMGMwNTg2ZmJiZjk2MjA5NDkwYTk0OTVhODQ1Y2U).

The is extension version `0.9.5`, which is targeted to [Fluree release `0.9.5`](s3://fluree-releases-public/fluree-0.9.5.zip).

## Connecting to a Database

To connect to a database, you must have a Fluree database running. You can either use a config file or manually specify your configuration details. 

### Config File

If you want to use a config file, create a `flureeConfig.json` file in the parent directory for your project. This file should include a single map with the following key-value pairs. 

```
{
    "network": "example",
    "db": "one",
    "ip": "http://localhost:8090"
}
```

Once you create this file, you will need to run the command: `Fluree: Set Config` see below.

### Set Config

To connect to a database, you will need to run the command `Fluree: Set Config`. 

To view the Command Palette, you can click on `View` -> `Command Palette`. On Mac, the shortcut to open the Command Palette is `cmd + shift + p`.

If you have a valid `flureeConfig.json` file, this configuration will be set based on what is included in that file.

If you do not, you will be asked to input your database's `ip`, `network`, and `db`.

### Get Config

You can run the command, `Fluree: Get Config` to view the current configuration.

## Query 

To issue a query, simply select a valid query with your cursor, and run the command, `Fluree: Query`. The results of the query will display in the file `flureeResponse.txt`. 

Note that the contents of `flureeResponse.txt` will be overwritten every time you issue a query or command. If you need to persist the results of a given query or transaction, please copy it into another file.

We only support issuing queries in `FlureeQL`.

## Transact

To issue a transaction, simply select a valid transaction with your cursor, and run the command, `Fluree: Transact`. The results of the query will display in the file `flureeResponse.txt`. Transactions are submitted using the root auth in the database. There is no way to change this currently.

Note that the contents of `flureeResponse.txt` will be overwritten every time you issue a query or command. If you need to persist the results of a given query or transaction, please copy it into another file.

## Smart Function Help

Issue the command, `Fluree: Smart Function Help` to see a list of all the smart functions in FlureeDB, as well as arguments, examples, and documentation.

