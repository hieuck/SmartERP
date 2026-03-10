#!/usr/bin/env python3
"""Fix delete tests to mock findOne for SecureRepository"""

import re

file_path = 'domains/manufacturing/mrp/production.service.spec.ts'

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Delete material test
content = re.sub(
    r"(it\('should delete material and invalidate cache', async \(\) => \{\s+const mockMaterial = \{ id: '1', name: 'Material 1', type: MaterialType\.RAW \};\s+mockCacheService\.getOrSet\.mockResolvedValue\(mockMaterial\);)\s+(mockMaterialRepository\.remove)",
    r"\1\n      mockMaterialRepository.findOne.mockResolvedValue(mockMaterial);\n      \2",
    content
)

# Fix 2: Delete mold test
content = re.sub(
    r"(it\('should delete mold and invalidate cache', async \(\) => \{\s+const mockMold = \{ id: '1', name: 'Mold 1' \};\s+mockCacheService\.getOrSet\.mockResolvedValue\(mockMold\);)\s+(mockMoldRepository\.remove)",
    r"\1\n      mockMoldRepository.findOne.mockResolvedValue(mockMold);\n      \2",
    content
)

# Fix 3: Delete BOM test
content = re.sub(
    r"(it\('should delete BOM and invalidate cache', async \(\) => \{\s+const mockBom = \{ id: '1', code: 'BOM001' \};\s+mockCacheService\.getOrSet\.mockResolvedValue\(mockBom\);)\s+(mockBomRepository\.remove)",
    r"\1\n      mockBomRepository.findOne.mockResolvedValue(mockBom);\n      \2",
    content
)

# Fix 4: Delete work order test
content = re.sub(
    r"(it\('should delete work order and invalidate cache', async \(\) => \{\s+const mockOrder = \{ id: '1', orderNumber: 'WO-000001' \};\s+mockCacheService\.getOrSet\.mockResolvedValue\(mockOrder\);)\s+(mockWorkOrderRepository\.remove)",
    r"\1\n      mockWorkOrderRepository.findOne.mockResolvedValue(mockOrder);\n      \2",
    content
)

# Fix 5: Delete quality check test
content = re.sub(
    r"(it\('should delete quality check and invalidate cache', async \(\) => \{\s+const mockCheck = \{ id: '1', checkNumber: 'QC-000001' \};\s+mockCacheService\.getOrSet\.mockResolvedValue\(mockCheck\);)\s+(mockQualityCheckRepository\.remove)",
    r"\1\n      mockQualityCheckRepository.findOne.mockResolvedValue(mockCheck);\n      \2",
    content
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed all 5 delete tests to mock findOne()")
