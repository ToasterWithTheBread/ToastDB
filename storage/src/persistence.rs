use rusqlite::{Connection, Result};

// FUNKTION FÜR SUCHANFRAGE

fn execute_query(query: &str) -> Result<Vec<String>> {
    let conn = Connection::open("database.db")?;
    let mut stmt = conn.prepare(query)?;
    let rows = stmt.query_map([], |row| row.get(0))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row?);
    }
    Ok(result)
}

// FUNKTION FÜR DATENEINLAGERUNG

pub fn insert(table: &str, value: &str) -> Result<Vec<String>> {
    let sql = format!("INSERT INTO {} (value) VALUES ('{}')", table, value);
    let query = execute_query(&sql)?;
    Ok(query)
}

pub fn delete(table: &str, value: &str) -> Result<Vec<String>> {
    let sql = format!("DELETE FROM {} WHERE value LIKE '%{}%'", table, value);
    let query = execute_query(&sql)?;
    Ok(query)
}

pub fn find(table: &str, value: &str) -> Result<Vec<String>> {
    let sql = format!("SELECT value FROM {} WHERE value LIKE '%{}%'", table, value);
    let query = execute_query(&sql)?;
    Ok(query)
}

// FUNKTION FÜR SPEICHERPLATZTABELLE

pub fn create_table(table: &str) -> Result<Vec<String>> {
    let sql = format!("CREATE TABLE IF NOT EXISTS {} (
        local_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        value TEXT NOT NULL
    );", table);
    let query = execute_query(&sql)?;
    Ok(query)
}

pub fn delete_table(table: &str) -> Result<Vec<String>> {
    let sql = format!("DROP TABLE IF EXISTS {};", table);
    let query = execute_query(&sql)?;
    Ok(query)
}

pub fn rename_table(old_name: &str, new_name: &str) -> Result<Vec<String>> {
    let sql = format!("ALTER TABLE {} RENAME TO {};", old_name, new_name);
    let query = execute_query(&sql)?;
    Ok(query)
}

pub fn list_tables() -> Result<Vec<String>> {
    let sql = format!("SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%';");
    let query = execute_query(&sql)?;
    Ok(query)
}