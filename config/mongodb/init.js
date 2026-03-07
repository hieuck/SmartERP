// Initialize MongoDB database for SmartERP

db = db.getSiblingDB('smart_erp');

// Create collections
db.createCollection('custom_fields');
db.createCollection('documents');
db.createCollection('activity_logs');

// Create indexes for custom_fields
db.custom_fields.createIndex({ tenant_id: 1, entity_type: 1 });
db.custom_fields.createIndex({ entity_id: 1 });

// Create indexes for documents
db.documents.createIndex({ tenant_id: 1, entity_type: 1, entity_id: 1 });
db.documents.createIndex({ created_at: -1 });

// Create indexes for activity_logs
db.activity_logs.createIndex({ tenant_id: 1, user_id: 1 });
db.activity_logs.createIndex({ entity_type: 1, entity_id: 1 });
db.activity_logs.createIndex({ created_at: -1 });

print('MongoDB initialization completed successfully');
