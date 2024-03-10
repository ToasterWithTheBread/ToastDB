#![allow(non_snake_case)]
#[macro_use]
extern crate rocket;
use serde_json;

mod functions;
mod persistence;

#[get("/")]
fn get_index() -> &'static str {
    "Hello, world!"
}

#[post("/")]
fn post_index() -> &'static str {
    "Hello, world!"
}

#[post("/test")]
fn test() -> &'static str {
    r#"{"status":0}"#
}

#[post("/insert/<table>", data = "<value>")]
fn insert(table: &str, value: &str) -> String {
    println!("Table: {}", table);
    let start_time = std::time::Instant::now();
    let json = functions::query_format(value);
    let result = persistence::insert(table, json);
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(_) => {
            format!(r#"{{"status":0}}"#)
        },
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}

#[post("/find/<table>", data = "<value>")]
fn find(table: &str, value: &str) -> String {
    println!("Table: {}", table);
    let start_time = std::time::Instant::now();
    let json = functions::query_format(value);
    let result = persistence::find(table, json);
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(query_result) => {
            let json_string = serde_json::to_string(&query_result).unwrap();
            format!(r#"{{"status":0, "result":{}}}"#, json_string)
        },
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}

#[post("/delete/<table>", data = "<value>")]
fn delete(table: &str, value: &str) -> String {
    println!("Table: {}", table);
    let start_time = std::time::Instant::now();
    let json = functions::query_format(value);
    let result = persistence::delete(table, json);
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(_) => {
            format!(r#"{{"status":0}}"#)
        },
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}

#[post("/create-table/<table>")]
fn create_table(table: &str) -> String {
    println!("Table: {}", table);
    let start_time = std::time::Instant::now();
    let result = persistence::create_table(table);
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(_) => format!(r#"{{"status":0}}"#),
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}

#[post("/delete-table/<table>")]
fn delete_table(table: &str) -> String {
    println!("Table: {}", table);
    let start_time = std::time::Instant::now();
    let result = persistence::delete_table(table);
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(_) => format!(r#"{{"status":0}}"#),
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}

#[post("/rename-table/<old_name>/<new_name>")]
fn rename_table(old_name: &str, new_name: &str) -> String {
    println!("Old table name: {}", old_name);
    println!("New table name: {}", new_name);
    let start_time = std::time::Instant::now();
    let result = persistence::rename_table(old_name, new_name);
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(_) => format!(r#"{{"status":0}}"#),
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}

#[post("/list-tables")]
fn list_tables() -> String {
    let start_time = std::time::Instant::now();
    let result = persistence::list_tables();
    let end_time = std::time::Instant::now();
    let duration = end_time.duration_since(start_time);
    println!("Time taken: {}ms", duration.as_millis());
    let result_string = match result {
        Ok(query_result) => {
            let json_string = serde_json::to_string(&query_result).unwrap();
            format!(r#"{{"status":0, "result":{}}}"#, json_string)
        },
        Err(error) => format!(r#"{{"status":1, "error":"{}"}}"#, error),
    };
    result_string
}


#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![
        get_index, 
        post_index, 

        test,

        insert,
        find,
        delete,

        create_table,
        delete_table,
        rename_table,
        list_tables
    ])
}