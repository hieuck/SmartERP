/**
 * Custom ESLint Rules for SmartERP Architecture Enforcement
 *
 * These rules enforce Odoo/ERPNext architecture patterns:
 * - SecureRepository usage instead of direct TypeORM queries
 * - PermissionService injection in services
 * - Tenant isolation in all queries
 */

module.exports = {
  rules: {
    /**
     * Rule: no-direct-repository-query
     *
     * Prevents direct TypeORM repository method calls in service files.
     * Forces usage of SecureRepository pattern for tenant isolation.
     *
     * ❌ BAD:
     * this.userRepository.findOne({ where: { id } })
     * this.projectRepository.find({ where: { tenantId } })
     *
     * ✅ GOOD:
     * this.secureUserRepo.findOne(user, { where: { id } })
     * this.secureProjectRepo.find(user, {})
     */
    'no-direct-repository-query': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow direct TypeORM repository queries, use SecureRepository instead',
          category: 'Best Practices',
          recommended: true,
        },
        messages: {
          directQuery:
            'Direct repository query detected. Use SecureRepository pattern instead: this.secure{{repoName}}.{{method}}(user, ...)',
        },
        schema: [],
      },
      create(context) {
        return {
          MemberExpression(node) {
            // Check if this is a repository method call
            const propertyName = node.property.name;
            const objectName = node.object.property?.name || '';

            // Detect patterns like: this.xxxRepository.find/findOne/save/update/delete
            if (
              objectName.endsWith('Repository') &&
              ['find', 'findOne', 'save', 'update', 'delete', 'remove'].includes(propertyName)
            ) {
              // Check if file is in exception list (would need to read architecture-exceptions.json)
              const filename = context.getFilename();

              // For now, report all violations
              // TODO: Integrate with architecture-exceptions.json
              context.report({
                node,
                messageId: 'directQuery',
                data: {
                  repoName: objectName.replace('Repository', 'Repo'),
                  method: propertyName,
                },
              });
            }
          },
        };
      },
    },

    /**
     * Rule: require-permission-service
     *
     * Ensures all service files inject PermissionService in constructor.
     *
     * ❌ BAD:
     * constructor(
     *   @InjectRepository(User) private userRepository: Repository<User>
     * ) {}
     *
     * ✅ GOOD:
     * constructor(
     *   @InjectRepository(User) private userRepository: Repository<User>,
     *   private permissionService: PermissionService
     * ) {}
     */
    'require-permission-service': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require PermissionService injection in service constructors',
          category: 'Best Practices',
          recommended: true,
        },
        messages: {
          missingPermissionService:
            'Service constructor must inject PermissionService for authorization checks',
        },
        schema: [],
      },
      create(context) {
        let hasPermissionService = false;
        let isServiceFile = false;

        return {
          Program(node) {
            const filename = context.getFilename();
            isServiceFile = filename.endsWith('.service.ts');
          },
          Identifier(node) {
            if (node.name === 'PermissionService') {
              hasPermissionService = true;
            }
          },
          'Program:exit'(node) {
            if (isServiceFile && !hasPermissionService) {
              // Check if file is in exception list
              // TODO: Integrate with architecture-exceptions.json
              context.report({
                node,
                messageId: 'missingPermissionService',
              });
            }
          },
        };
      },
    },

    /**
     * Rule: require-secure-repository
     *
     * Ensures services create SecureRepository instances.
     *
     * ❌ BAD:
     * // No SecureRepository instantiation
     *
     * ✅ GOOD:
     * this.secureUserRepo = new SecureRepository(
     *   userRepository,
     *   permissionService,
     *   'User'
     * );
     */
    'require-secure-repository': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require SecureRepository instantiation in services',
          category: 'Best Practices',
          recommended: true,
        },
        messages: {
          missingSecureRepository:
            'Service must create SecureRepository instance for tenant isolation',
        },
        schema: [],
      },
      create(context) {
        let hasSecureRepository = false;
        let isServiceFile = false;

        return {
          Program(node) {
            const filename = context.getFilename();
            isServiceFile = filename.endsWith('.service.ts');
          },
          Identifier(node) {
            if (node.name === 'SecureRepository') {
              hasSecureRepository = true;
            }
          },
          'Program:exit'(node) {
            if (isServiceFile && !hasSecureRepository) {
              // Check if file is in exception list
              // TODO: Integrate with architecture-exceptions.json
              context.report({
                node,
                messageId: 'missingSecureRepository',
              });
            }
          },
        };
      },
    },
  },
};
