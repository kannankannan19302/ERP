const { Model } = require('objection');
const BaseModel = require('../../../models/BaseModel');

/**
 * Category model
 * @extends BaseModel
 */
class Category extends BaseModel {
  static get tableName() {
    return 'categories';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'tenantId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        parentId: { type: ['string', 'null'], format: 'uuid' },
        slug: { type: 'string', maxLength: 255 },
        imageUrl: { type: ['string', 'null'], maxLength: 500 },
        isActive: { type: 'boolean', default: true },
        sortOrder: { type: 'integer', default: 0 },
        tenantId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Product = require('./Product');
    const Tenant = require('../../../models/Tenant');

    return {
      products: {
        relation: Model.HasManyRelation,
        modelClass: Product,
        join: {
          from: 'categories.id',
          to: 'products.categoryId'
        }
      },
      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: Category,
        join: {
          from: 'categories.parentId',
          to: 'categories.id'
        }
      },
      children: {
        relation: Model.HasManyRelation,
        modelClass: Category,
        join: {
          from: 'categories.id',
          to: 'categories.parentId'
        }
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: Tenant,
        join: {
          from: 'categories.tenantId',
          to: 'tenants.id'
        }
      }
    };
  }

  /**
   * Generate slug from name
   * @param {string} name - Category name
   * @returns {string} Generated slug
   */
  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get category with full path
   * @param {Object} trx - Transaction object
   * @returns {Promise<Object>} Category with full path
   */
  async getWithPath(trx) {
    if (!this.parentId) {
      return {
        ...this,
        path: [this.name],
        fullPath: this.name
      };
    }
    
    const parent = await Category.query(trx)
      .findById(this.parentId);
    
    if (!parent) {
      return {
        ...this,
        path: [this.name],
        fullPath: this.name
      };
    }
    
    const parentWithPath = await parent.getWithPath(trx);
    const path = [...parentWithPath.path, this.name];
    
    return {
      ...this,
      path,
      fullPath: path.join(' > ')
    };
  }

  /**
   * Get all descendant categories
   * @param {Object} trx - Transaction object
   * @returns {Promise<Array>} Descendant categories
   */
  async getDescendants(trx) {
    const children = await Category.query(trx)
      .where('parentId', this.id);
    
    if (!children.length) {
      return [];
    }
    
    const descendants = [...children];
    
    for (const child of children) {
      const childDescendants = await child.getDescendants(trx);
      descendants.push(...childDescendants);
    }
    
    return descendants;
  }
}

module.exports = Category;