# Fluree: Beyond the Database

Build better applications with a tamper-proof blockchain ledger, semantic graph query engine, linearly scalable query edge servers, and co-resident data security

## Download

To download the extension, search the VS Code Extension: Marketplace for `Fluree: Beta` or [download here](https://marketplace.visualstudio.com/items?itemName=Fluree.fluree).

## Extension

Welcome to the `Fluree` VS Code extension. This extension connects to a single Fluree database, and allows you to issue queries, transaction, and tests against that database.

Please note this is a beta version of the Fluree extension. Any issues and feature ideas can be sent to support@flur.ee. You can also join our [Slack channel](https://join.slack.com/t/flureedb/shared_invite/enQtNTM1NzI4MTEzODA4LWEzNTMzN2VmYjBiODQ5MDUzODg1M2E3OTBjNGVmM2EwNmZhMGMwNTg2ZmJiZjk2MjA5NDkwYTk0OTVhODQ1Y2U).

[Fluree release `1.0.0-beta18`](https://fluree-releases-public.s3.amazonaws.com/fluree-1.0.0-beta18.zip).

## Connecting to a Database

To connect to a database, you must have a Fluree database running. You can either use a config file or manually specify your configuration details.

### Configuring the extension

```
"fluree.host": "http://localhost:8090"
"fluree.db": "test"
"fluree.network": "test"
"fluree.apiKey": "asldkfjasdl;kjas"
```

![Fluree Extension Configuration](https://raw.githubusercontent.com/fluree/vscode-fluree/main/images/configuration.png)

### Set Config

You can set the config in VS Code user settings, but also, can run the Set Config command to show the values

### Set Nexus Config

Allows you to input the URL from the Nexus Connect tab on your dataset to populate host, db, and network and prompt you for apiKey

### Get Config

You can run the command, `Fluree: Get Config` to view the current configuration.

## Query

To issue a query, simply select a valid query with your cursor, and run the command, `Fluree: Query`.

Note that the contents of `flureeResponse.txt` will be overwritten every time you issue a query or command. If you need to persist the results of a given query or transaction, please copy it into another file.

We only support issuing queries in `FlureeQL`.

## History, Block, Multi-Query

To issue a query of the types - block, history, or multi-query, simply select a valid query with your cursor, and run the command, `Fluree: Block Query`, `Fluree: Multi Query`, or `Fluree: History Query`.

Note that the contents of `flureeResponse.txt` will be overwritten every time you issue a query or command. If you need to persist the results of a given query or transaction, please copy it into another file.

## Get Schema Migration Files

To issue get-schema-migrations, simply run the command, `Fluree: Get Schema Migrations`. The results will display in the directory `migrations/`.

Get-schema-migrations returns a block-indexed set of updates to your ledger's schema, where each file is a valid JSON transaction that can be issued against Fluree to recreate steps in the state of the ledger's schema.

The goal of this feature is to assist with source code version control across teams, and to track the history of a ledger's schema across each of the blocks relevant in the production of that schema.

Note: this will only work with Fluree 0.11.0 and higher.

## Gen Flakes

To issue gen-flakes, simply select a valid transaction with your cursor, and run the command, `Fluree: Gen-Flakes`. The results will display in the file `flureeResponse.txt`.

Gen-flakes returns the list of flakes that would be added to a ledger if a given transaction is issued. The body of this request is simply the transaction. Note that this is a test endpoint. This does NOT write the returned flakes to the ledger.

Note: this will only work with Fluree 0.11.0 and higher.

## Query With

To issue query-with, simply select a valid query-with statement (a map with `query` and `flakes` keys) with your cursor, and run the command, `Fluree: Query-With`. The results will display in the file `flureeResponse.txt`.

Gen-flakes returns the list of flakes that would be added to a ledger if a given transaction is issued. The body of this request is simply the transaction. Note that this is a test endpoint. This does NOT write the returned flakes to the ledger.

Query-with returns the results of a query using the existing database flakes, including flakes that are provided with the query.

The request expects a map with two key-value pairs:

- flakes: An array of valid flakes
- query: A query to issue against the current database plus the flakes in the flakes value.

The t on the flakes provided has to be current with the latest database. For example, if you used gen-flakes, but then issued a transaction, you will need to use gen-flakes again to generate new valid flakes.

Note: this will only work with Fluree 0.11.0 and higher.

## Test Transact With

To issue test-transact-with, simply select a valid test-transact-with statement (a map with `tx` and `flakes` keys) with your cursor, and run the command, `Fluree: Test-Transact-With`. The results will display in the file `flureeResponse.txt`.

Given a valid set of flakes that could be added to the database at a given point in time and a transaction, test-transact-with returns the flakes that would be added to a ledger if a given transaction is issued.

The request expects a map with the following key-value pairs:

- flakes: An array of valid flakes
- txn: A transaction to issue against the current database plus the flakes in the flakes value. This endpoint does NOT actually write the transaction to the ledger.
- auth: (Optional) The \_auth/id with which to issue the transaction.

The t on the flakes provided has to be current with the latest database. For example, if you used gen-flakes, but then issued a transaction, you will need to use gen-flakes again to generate new valid flakes.

Note: this will only work with Fluree 0.11.0 and higher.

## Transact

To issue a transaction, simply select a valid transaction with your cursor, and run the command, `Fluree: Transact`. Transactions are submitted using the root auth in the database. There is no way to change this currently.
