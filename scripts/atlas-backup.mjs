import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { webcrypto } from 'node:crypto';
import mongodb from 'mongodb';

globalThis.crypto ??= webcrypto;
const { MongoClient } = mongodb;
const { EJSON } = mongodb.BSON;

const [configFile, outputDir] = process.argv.slice(2);
if (!configFile || !outputDir) {
	throw new Error('Usage: node atlas-backup.mjs <config-file> <output-dir>');
}

const { uri, database } = JSON.parse(await readFile(configFile, 'utf8'));
const client = new MongoClient(uri);
await mkdir(outputDir, { recursive: true });
await client.connect();

try {
	const db = client.db(database);
	const metadata = await db.listCollections().toArray();
	const manifest = { createdAt: new Date().toISOString(), database, collections: [] };

	for (const collectionInfo of metadata) {
		const collection = db.collection(collectionInfo.name);
		const [documents, indexes] = await Promise.all([
			collection.find({}).toArray(),
			collection.indexes(),
		]);
		await writeFile(path.join(outputDir, `${collectionInfo.name}.ejson`), EJSON.stringify(documents, { relaxed: false }));
		await writeFile(path.join(outputDir, `${collectionInfo.name}.indexes.ejson`), EJSON.stringify(indexes, { relaxed: false }));
		manifest.collections.push({
			name: collectionInfo.name,
			count: documents.length,
			indexCount: indexes.length,
			options: collectionInfo.options || {},
		});
	}

	await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
	console.log(JSON.stringify({ backup: outputDir, collections: manifest.collections.map(({ name, count, indexCount }) => ({ name, count, indexCount })) }));
} finally {
	await client.close();
}
