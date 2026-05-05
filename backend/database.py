import psycopg2

class DatabaseManagement:
    def __init__(self, conn, cur):
        self.conn = None
        self.cur = None
        
    def connection(self, host: str, database: str, user: str, password: str):
        conn = psycopg2.connect(
            host = host,
            database = database,
            user = user,
            password = password
        )
        cur = conn.cursor()
        self.conn = conn
        self.cur = cur
        return conn, cur
    
    def zipper(self, cur, rows):
        if not rows:
            return None
        
        columns = [desc[0] for desc in cur.description]
        if len(rows) == 1:
            return dict(zip(columns, rows[0]))
        return [dict(zip(columns, row)) for row in rows]
    
    def execute(self, query: str, params: tuple):
        conn = self.conn
        cur = self.cur
        try:
            cur.execute(query, params)
            if cur.description:
                result = cur.fetchall()
                return self.zipper(cur, result)
            
            conn.commit()
            return None
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            conn.close()