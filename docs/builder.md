# Builder Module Documentation

## Overview

The Builder Module is a powerful low-code/no-code platform that allows users to create fully customized modules and applications with a drag-and-drop interface. It enables administrators and super administrators to extend the ERP system without writing code.

## Features

### 1. Visual Module Designer
- Drag-and-drop interface for creating modules
- Real-time preview of module structure
- Template-based module creation
- Module versioning and publishing

### 2. Dynamic Schema Generation
- Create custom entities (database tables)
- Define custom fields with various data types
- Set field validation rules and constraints
- Establish relationships between entities

### 3. Form Builder
- Visual form designer
- Multiple layout options (single column, two column, tabs, accordion)
- Field grouping and sections
- Conditional field visibility
- Custom validation rules

### 4. Workflow Engine
- Visual workflow designer
- State-based workflows
- Approval processes
- Automated actions and notifications
- Integration with existing modules

### 5. Report Builder
- Drag-and-drop report designer
- Multiple report types (tabular, chart, dashboard)
- Custom filters and grouping
- Scheduled report generation
- Export to various formats

### 6. Permission Management
- Module-level permissions
- Field-level access control
- Record-level security
- Role-based access control integration

## Architecture

### 1. Core Components

```
Builder Module Architecture:
┌─────────────────────────────────────────────────────────────────┐
│                        Builder Frontend                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Module        │   Form          │    Workflow                 │
│   Designer      │   Builder       │    Designer                 │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Builder API Layer                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Schema        │   Form          │    Workflow                 │
│   Generator     │   Generator     │    Engine                   │
└─────────────────┴─────────────────┴─────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Dynamic Runtime                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Dynamic       │   Dynamic       │    Dynamic                  │
│   Models        │   Controllers   │    Routes                   │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 2. Database Schema

The Builder Module uses several core tables to store module definitions:

```sql
-- Custom Modules
CREATE TABLE custom_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(20),
    version VARCHAR(20) DEFAULT '1.0.0',
    status VARCHAR(20) DEFAULT 'draft',
    schema_definition JSONB NOT NULL,
    ui_definition JSONB,
    workflow_definition JSONB,
    permissions JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

-- Dynamic Records Storage
CREATE TABLE dynamic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    module_id UUID REFERENCES custom_modules(id),
    record_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Module Definition Structure

### 1. Schema Definition

```json
{
  "tableName": "custom_inspections",
  "displayName": "Quality Inspections",
  "fields": [
    {
      "name": "inspection_date",
      "type": "date",
      "label": "Inspection Date",
      "required": true,
      "validation": {
        "min": "2020-01-01",
        "max": "2030-12-31"
      }
    },
    {
      "name": "inspector_name",
      "type": "text",
      "label": "Inspector Name",
      "required": true,
      "validation": {
        "minLength": 2,
        "maxLength": 100
      }
    },
    {
      "name": "quality_score",
      "type": "number",
      "label": "Quality Score",
      "required": true,
      "validation": {
        "min": 0,
        "max": 100
      }
    },
    {
      "name": "status",
      "type": "select",
      "label": "Status",
      "required": true,
      "options": [
        {"value": "pending", "label": "Pending"},
        {"value": "approved", "label": "Approved"},
        {"value": "rejected", "label": "Rejected"}
      ]
    },
    {
      "name": "notes",
      "type": "textarea",
      "label": "Notes",
      "required": false
    },
    {
      "name": "attachments",
      "type": "file",
      "label": "Attachments",
      "multiple": true,
      "accept": ["image/*", "application/pdf"]
    }
  ],
  "relationships": [
    {
      "name": "product",
      "type": "belongsTo",
      "relatedTable": "products",
      "foreignKey": "product_id",
      "displayField": "name"
    }
  ],
  "indexes": [
    {
      "fields": ["inspection_date", "status"],
      "type": "btree"
    }
  ]
}
```

### 2. UI Definition

```json
{
  "listView": {
    "columns": [
      {
        "field": "inspection_date",
        "label": "Date",
        "sortable": true,
        "filterable": true,
        "width": 120
      },
      {
        "field": "inspector_name",
        "label": "Inspector",
        "sortable": true,
        "searchable": true,
        "width": 150
      },
      {
        "field": "quality_score",
        "label": "Score",
        "sortable": true,
        "filterable": true,
        "width": 100,
        "format": "number"
      },
      {
        "field": "status",
        "label": "Status",
        "sortable": true,
        "filterable": true,
        "width": 120,
        "format": "badge"
      }
    ],
    "filters": [
      {
        "field": "status",
        "type": "select",
        "options": ["pending", "approved", "rejected"]
      },
      {
        "field": "inspection_date",
        "type": "dateRange"
      }
    ],
    "actions": [
      {
        "name": "approve",
        "label": "Approve",
        "icon": "check",
        "condition": "status === 'pending'",
        "permission": "inspections.approve"
      }
    ]
  },
  "formView": {
    "layout": "two-column",
    "sections": [
      {
        "title": "Basic Information",
        "fields": ["inspection_date", "inspector_name", "product"]
      },
      {
        "title": "Quality Assessment",
        "fields": ["quality_score", "status", "notes"]
      },
      {
        "title": "Attachments",
        "fields": ["attachments"]
      }
    ],
    "validation": {
      "rules": [
        {
          "field": "quality_score",
          "condition": "status === 'approved'",
          "rule": "min:70",
          "message": "Quality score must be at least 70 for approval"
        }
      ]
    }
  },
  "detailView": {
    "layout": "tabs",
    "tabs": [
      {
        "name": "details",
        "label": "Details",
        "fields": ["inspection_date", "inspector_name", "quality_score", "status", "notes"]
      },
      {
        "name": "attachments",
        "label": "Attachments",
        "fields": ["attachments"]
      },
      {
        "name": "history",
        "label": "History",
        "component": "AuditHistory"
      }
    ]
  }
}
```

### 3. Workflow Definition

```json
{
  "states": [
    {
      "name": "draft",
      "label": "Draft",
      "initial": true,
      "color": "gray"
    },
    {
      "name": "submitted",
      "label": "Submitted",
      "color": "blue"
    },
    {
      "name": "approved",
      "label": "Approved",
      "color": "green"
    },
    {
      "name": "rejected",
      "label": "Rejected",
      "color": "red"
    }
  ],
  "transitions": [
    {
      "name": "submit",
      "from": "draft",
      "to": "submitted",
      "label": "Submit for Review",
      "conditions": [
        {
          "field": "quality_score",
          "operator": "gte",
          "value": 0
        }
      ],
      "actions": [
        {
          "type": "notification",
          "recipients": ["quality_manager"],
          "template": "inspection_submitted"
        }
      ]
    },
    {
      "name": "approve",
      "from": "submitted",
      "to": "approved",
      "label": "Approve",
      "permission": "inspections.approve",
      "conditions": [
        {
          "field": "quality_score",
          "operator": "gte",
          "value": 70
        }
      ],
      "actions": [
        {
          "type": "notification",
          "recipients": ["creator"],
          "template": "inspection_approved"
        },
        {
          "type": "webhook",
          "url": "/api/integrations/quality-approved",
          "method": "POST"
        }
      ]
    },
    {
      "name": "reject",
      "from": "submitted",
      "to": "rejected",
      "label": "Reject",
      "permission": "inspections.approve",
      "requiresComment": true,
      "actions": [
        {
          "type": "notification",
          "recipients": ["creator"],
          "template": "inspection_rejected"
        }
      ]
    }
  ]
}
```

## API Endpoints

### 1. Module Management

```javascript
// Get all custom modules
GET /api/v1/builder/modules

// Get module by ID
GET /api/v1/builder/modules/:id

// Create new module
POST /api/v1/builder/modules

// Update module
PUT /api/v1/builder/modules/:id

// Delete module
DELETE /api/v1/builder/modules/:id

// Publish module
POST /api/v1/builder/modules/:id/publish

// Get module versions
GET /api/v1/builder/modules/:id/versions
```

### 2. Dynamic Data Management

```javascript
// Get records from custom module
GET /api/v1/builder/modules/:moduleId/records

// Create record in custom module
POST /api/v1/builder/modules/:moduleId/records

// Update record
PUT /api/v1/builder/modules/:moduleId/records/:recordId

// Delete record
DELETE /api/v1/builder/modules/:moduleId/records/:recordId

// Execute workflow action
POST /api/v1/builder/modules/:moduleId/records/:recordId/actions/:actionName
```

### 3. Schema Management

```javascript
// Validate schema
POST /api/v1/builder/schema/validate

// Generate migration
POST /api/v1/builder/schema/migrate

// Preview changes
POST /api/v1/builder/schema/preview
```

## Frontend Components

### 1. Module Designer

```jsx
import React from 'react';
import { ModuleDesigner } from '@/components/builder/ModuleDesigner';

const BuilderPage = () => {
  return (
    <div className="builder-page">
      <ModuleDesigner
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />
    </div>
  );
};
```

### 2. Form Builder

```jsx
import React from 'react';
import { FormBuilder } from '@/components/builder/FormBuilder';

const FormDesigner = ({ schema, onSchemaChange }) => {
  return (
    <FormBuilder
      schema={schema}
      onChange={onSchemaChange}
      components={availableComponents}
      layouts={availableLayouts}
    />
  );
};
```

### 3. Dynamic Form Renderer

```jsx
import React from 'react';
import { DynamicForm } from '@/components/builder/DynamicForm';

const CustomModuleForm = ({ moduleId, recordId }) => {
  return (
    <DynamicForm
      moduleId={moduleId}
      recordId={recordId}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};
```

## Implementation Guide

### 1. Backend Implementation

#### Schema Generator

```javascript
class SchemaGenerator {
  generateModel(schema) {
    const fields = schema.fields.map(field => ({
      name: field.name,
      type: this.mapFieldType(field.type),
      constraints: this.generateConstraints(field)
    }));

    return this.createDynamicModel(schema.tableName, fields);
  }

  mapFieldType(type) {
    const typeMap = {
      'text': 'VARCHAR(255)',
      'textarea': 'TEXT',
      'number': 'DECIMAL(15,2)',
      'integer': 'INTEGER',
      'date': 'DATE',
      'datetime': 'TIMESTAMP',
      'boolean': 'BOOLEAN',
      'select': 'VARCHAR(100)',
      'multiselect': 'JSONB',
      'file': 'JSONB'
    };

    return typeMap[type] || 'TEXT';
  }

  generateConstraints(field) {
    const constraints = [];

    if (field.required) {
      constraints.push('NOT NULL');
    }

    if (field.validation) {
      if (field.validation.unique) {
        constraints.push('UNIQUE');
      }
      
      if (field.validation.minLength || field.validation.maxLength) {
        const min = field.validation.minLength || 0;
        const max = field.validation.maxLength || 255;
        constraints.push(`CHECK (LENGTH(${field.name}) BETWEEN ${min} AND ${max})`);
      }
    }

    return constraints;
  }
}
```

#### Dynamic Controller Generator

```javascript
class ControllerGenerator {
  generateController(moduleSchema) {
    const controllerCode = `
      class ${moduleSchema.name}Controller {
        static async getRecords(req, res, next) {
          try {
            const records = await DynamicModel.findAll({
              moduleId: '${moduleSchema.id}',
              tenantId: req.tenantId,
              ...req.query
            });
            
            res.json({
              success: true,
              data: records
            });
          } catch (error) {
            next(error);
          }
        }

        static async createRecord(req, res, next) {
          try {
            const record = await DynamicModel.create({
              moduleId: '${moduleSchema.id}',
              tenantId: req.tenantId,
              data: req.body
            });
            
            res.status(201).json({
              success: true,
              data: record
            });
          } catch (error) {
            next(error);
          }
        }

        // ... other CRUD methods
      }
    `;

    return this.compileController(controllerCode);
  }
}
```

### 2. Frontend Implementation

#### Module Designer Component

```jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ModuleDesigner = ({ onSave }) => {
  const [schema, setSchema] = useState({
    name: '',
    fields: [],
    relationships: []
  });

  const [availableFields] = useState([
    { type: 'text', label: 'Text Field', icon: 'text' },
    { type: 'number', label: 'Number Field', icon: 'hash' },
    { type: 'date', label: 'Date Field', icon: 'calendar' },
    { type: 'select', label: 'Select Field', icon: 'list' },
    { type: 'file', label: 'File Upload', icon: 'upload' }
  ]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === 'available-fields' && 
        destination.droppableId === 'schema-fields') {
      const field = availableFields[source.index];
      const newField = {
        ...field,
        id: generateId(),
        name: `field_${schema.fields.length + 1}`,
        label: field.label,
        required: false
      };

      setSchema(prev => ({
        ...prev,
        fields: [...prev.fields, newField]
      }));
    }
  };

  return (
    <div className="module-designer">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="designer-layout">
          <div className="field-palette">
            <h3>Available Fields</h3>
            <Droppable droppableId="available-fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {availableFields.map((field, index) => (
                    <Draggable
                      key={field.type}
                      draggableId={field.type}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="field-item"
                        >
                          <Icon name={field.icon} />
                          {field.label}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div className="schema-builder">
            <h3>Module Schema</h3>
            <Droppable droppableId="schema-fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {schema.fields.map((field, index) => (
                    <SchemaField
                      key={field.id}
                      field={field}
                      index={index}
                      onUpdate={(updatedField) => updateField(index, updatedField)}
                      onDelete={() => deleteField(index)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div className="properties-panel">
            <ModuleProperties
              schema={schema}
              onChange={setSchema}
            />
          </div>
        </div>
      </DragDropContext>

      <div className="designer-actions">
        <button onClick={() => onSave(schema)}>Save Module</button>
        <button onClick={() => previewModule(schema)}>Preview</button>
      </div>
    </div>
  );
};
```

## Best Practices

### 1. Schema Design
- Use descriptive field names
- Set appropriate validation rules
- Consider performance implications of indexes
- Plan for data migration when updating schemas

### 2. UI Design
- Follow consistent design patterns
- Ensure responsive layouts
- Provide clear field labels and help text
- Implement proper error handling

### 3. Workflow Design
- Keep workflows simple and intuitive
- Provide clear state transitions
- Include appropriate notifications
- Test all workflow paths

### 4. Security
- Implement proper permission checks
- Validate all user inputs
- Sanitize dynamic SQL queries
- Audit all module changes

### 5. Performance
- Use appropriate database indexes
- Implement caching for frequently accessed data
- Optimize query performance
- Monitor resource usage

## Limitations and Considerations

### 1. Current Limitations
- Complex relationships require manual configuration
- Advanced validation rules need custom code
- Performance optimization may require database tuning
- Some UI components may not be available in the builder

### 2. Future Enhancements
- Visual relationship designer
- Advanced formula builder
- Custom component library
- Integration with external APIs
- Mobile app builder
- Advanced reporting features

This Builder Module provides a powerful foundation for creating custom applications within the ERP system while maintaining security, performance, and usability standards.