# ToastDB-database
Simple, scalable, distributed NoSQL database

# What is it made of
The database itself is made with Rust built ontop of SQLite, with some 
preset table values to make an almost key/value store, to increase performance
we use caching techniques

We chose SQLite because it confirms that all of the writes are saved to
the disk, which ensures data persistence.

The "engine"/server that handles the distribution and routing
is built on Node.js with Express, which we may change later to ensure
better performance.

# How to use ToastDB
Just copy the files using Git and build using the Dockerfile in each directory,
we recommend running about 3 "nodes" with one routing server to start, then you can add more nodes
later on.

You can also install the Node/Rust languages and run the code directly, 
which is more complex and not recommended.

# Use cases
We would recommend using MongoDB for speed and ease of access because of native drivers,
but we would recommend running ToastDB for storing large amounts of data across multiple
servers, where speed is not priority (such as analytics).

# Warnings
There is no 100% that ToastDB will fully persist data and tables across numerous nodes,
especially if more nodes are added later on.

Speed is determined by caching, SQLite, and network latency, because ToastDB sends requests
to each node to make operations, it is recommended to have each node on a VPN or local network
for lowest latency

ToastDB is also not secure by default, it is recommended to access from behind a VPN,
such as Tailscale to ensure security, or operate ToastDB behind a Cloudflared tunnel
with security policies enabled.

# How to access
Once you get your nodes and server setup, you can insert and query and perform operations on the 
data by sending POST requests to the server, the main reason we did this is to avoid needing
individual drivers for each language, the downside can be the large amount of boiler code needed
depending on the language.

**ALL OF THESE ARE POST REQUESTS**

**DATA IS RETURNED IN TRADITIONAL JSON**

## Status
**https://[your-server-ip:9898]/**

## Insert
**https://[your-server-ip:9898]/insert/table**

>Example: {"name":"John Doe", "age":29, "ssn":"123-45-678"}

## Find
**https://[your-server-ip:9898]/find/table**

>Example: {"name":"John Doe"}

## Update
**https://[your-server-ip:9898]/update/table**

*Note: the update operation is the most intensive operation, try to avoid it*

>Example: { $old: {"name":"John Doe"}, $new: {"name":"Alex Doe"} }

## Delete
**https://[your-server-ip:9898]/delete/table**

>Example: {"name":"John Doe"}

## Create table
**https://[your-server-ip:9898]/create-table/name**

## Rename table
**https://[your-server-ip:9898]/rename-table/old_name/new_name**

## Delete table
**https://[your-server-ip:9898]/delete-table/name**

## List tables
**https://[your-server-ip:9898]/list-tables**

## New node
**https://[your-server-ip:9898]/new-node**

>Example: {"name":"local-cluster-1", "enabled":true, "url":"http://[storage-server-ip:8989]", "tag":"prod"}


## Delete node
**https://[your-server-ip:9898]/delete-node**

>Example: {"name":"local-cluster-1"}

## List nodes
**https://[your-server-ip:9898]/list-nodes**

>Example: {"tag":"prod"}


## List errors
**https://[your-server-ip:9898]/list-errors**

>Example: {}

## Delete errors
**https://[your-server-ip:9898]/delete-errors**

>Example: {}

# TODO

>Nothing currently, create a new issue for recommendations

# Caching
Currently the cache timer is set at 3 minutes, when the key expires
the data will need to be re-fetched from the databases.

What this means is that the data will be published every three minutes, if
the data is updated. The cache timer DOES NOT reset on each query.

# Known issues
>1000+ nodes slows down local database

>Network latency

>Memory usage for cache

>Axios concurrency speed

>Iteration speed for JSON results

>UUID and Unix generation unknown performance

>SQLite locking (maybe)

# Contributing
Pull requests and merge requests will be reviewed and approved,
please try to keep them concise.

This project is far from complete, but it will eventually get there.
