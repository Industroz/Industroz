import sqlite3 from "sqlite3";

type KeyValuePair<T> = { Key: string, Value: T };

export default class DataBase<ValueType> {
    private DatabaseName: string;
    private Database: sqlite3.Database = undefined as any;

    constructor(
        DataBaseName: string
    ) {
        this.DatabaseName = DataBaseName;
        this.Database = new sqlite3.Database(`./databases/${DataBaseName}.sqlite`);
    }

    async Init(): Promise<DataBase<ValueType>> {
        return await new Promise<DataBase<ValueType>>((resolve, reject) => {
            this.Database.all(`
                CREATE TABLE IF NOT EXISTS ${this.DatabaseName} (
                    Key VARCHAR(255) NOT NULL,
                    Value LONGTEXT
                );
            `);
            resolve(this);
        });
    }

    async Set(Key: string, Value: ValueType, Update: boolean = true): Promise<KeyValuePair<ValueType>> {
        return await new Promise<KeyValuePair<ValueType>>(async (resolve, reject) => {
            const ExistingValue = await this.Get(Key);

            if (ExistingValue) {
                if (Update) {
                    this.Database.all(`
                        UPDATE ${this.DatabaseName}
                        SET Value = '${JSON.stringify(Value)}'
                        WHERE Key = '${Key}'
                    `)
                }
                else resolve({ Key: Key, Value: ExistingValue })
            }
            else {
                this.Database.all(`
                    INSERT INTO ${this.DatabaseName} (Key, Value)
                    VALUES (
                        '${Key}',
                        '${JSON.stringify(Value)}'
                    );
                `);
            }

            resolve({ Key: Key, Value: Value });
        });
    }

    async Get(Key: string | "All"): Promise<ValueType> {
        return new Promise<ValueType>((resolve, reject) => {
            this.Database.all(
                `SELECT Key, Value FROM ${this.DatabaseName}
                WHERE Key = '${Key}'`,
                (Error: Error, Rows: { Key: string; Value: string; }[]) => {
                    if (Error) {
                        console.error(Error);
                        return;
                    }

                    if (Rows[0] !== undefined && Rows[0]["Value"] !== 'undefined') resolve(JSON.parse(Rows[0]["Value"]));
                    else resolve(undefined as ValueType);
                }
            );
        });
    }

    async GetAll(): Promise<{ [Key: string]: ValueType }> {
        return new Promise((resolve, reject) => {
            this.Database.all(`
                SELECT Key, Value FROM ${this.DatabaseName}
            `,
            (Error: Error, Rows: { Key: string; Value: string; }[]) => {
                if (Error) {
                    console.log(Error);
                    return;
                }

                const _Data: { [Key: string]: ValueType } = {};
                Rows.forEach((KeyValue) => { _Data[KeyValue["Key"]] = JSON.parse(KeyValue["Value"]); });
                resolve(_Data);
            });
        });
    }
};