from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from api.models import Base
from api.database import engine
import os

load_dotenv()

def reset_database():
    # WARNING: This will delete all data!
    print("WARNING: This will delete all data in the database!")
    confirm = input("Type 'YES' to confirm: ")
    
    if confirm != "YES":
        print("Database reset cancelled.")
        return
    
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating tables with new schema...")
    Base.metadata.create_all(bind=engine)
    
    print("Database reset complete!")

if __name__ == "__main__":
    reset_database()