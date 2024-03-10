# Storage node
This is where the data is stored, it is not recommended to access this node
directly, but rather to use the server.

The main reason to access the node directly would be because the server is down, or
because some data is corrupted or not transferring.

# How to access

**ALL OF THESE ARE POST REQUESTS**

**THE DATA IS NOT RETURNED IN JSON FORMAT**

## Test
**https://[your-server-ip:8989]/test**

## Insert
**https://[your-server-ip:8989]/insert/table**

>Example: {"name":"John Doe", "age":29, "ssn":"123-45-678"}

## Find
**https://[your-server-ip:8989]/find/table**

>Example: {"name":"John Doe"}

## Delete
**https://[your-server-ip:8989]/delete/table**

>Example: {"name":"John Doe"}

## Create table
**https://[your-server-ip:8989]/create-table/name**

## Rename table
**https://[your-server-ip:8989]/rename-table/old_name/new_name**

## Delete table
**https://[your-server-ip:8989]/delete-table/name**

## List tables
**https://[your-server-ip:8989]/list-tables**
