import React, { type ReactNode } from 'react';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_NAME, initializeDatabase } from './schema';

export const useDatabase = (): SQLiteDatabase => useSQLiteContext();
export const useDatabaseReady = (): boolean => true;

export const DatabaseProvider = ({ children }: { children: ReactNode }) => (
  <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
    {children}
  </SQLiteProvider>
);
