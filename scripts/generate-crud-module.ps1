#!/usr/bin/env pwsh
# SmartERP CRUD Module Generator
# Generates service, controller, module, and test files from templates

param(
    [Parameter(Mandatory=$true)]
    [string]$EntityName,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath
)

function Convert-ToKebabCase {
    param([string]$Text)
    $result = $Text -creplace '([A-Z])', '-$1'
    $result = $result.Trim('-').ToLower()
    return $result
}

function Convert-ToCamelCase {
    param([string]$Text)
    return $Text.Substring(0,1).ToLower() + $Text.Substring(1)
}

function Replace-Placeholders {
    param(
        [string]$Content,
        [string]$EntityName,
        [string]$EntityNameKebab,
        [string]$EntityNameCamel
    )
    
    $Content = $Content -replace '\{\{EntityName\}\}', $EntityName
    $Content = $Content -replace '\{\{entity-name\}\}', $EntityNameKebab
    $Content = $Content -replace '\{\{entityName\}\}', $EntityNameCamel
    
    return $Content
}

Write-Host "SmartERP CRUD Module Generator" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Validate EntityName
if ($EntityName -notmatch '^[A-Z][a-zA-Z0-9]*$') {
    Write-Host "Error: EntityName must be PascalCase" -ForegroundColor Red
    exit 1
}

# Convert names
$EntityNameKebab = Convert-ToKebabCase -Text $EntityName
$EntityNameCamel = Convert-ToCamelCase -Text $EntityName

Write-Host "Entity Information:" -ForegroundColor Yellow
Write-Host "  PascalCase: $EntityName"
Write-Host "  kebab-case: $EntityNameKebab"
Write-Host "  camelCase:  $EntityNameCamel"
Write-Host "  Domain:     $Domain"
Write-Host ""

# Determine output path
if ([string]::IsNullOrEmpty($OutputPath)) {
    $OutputPath = "src/backend/domains/$Domain/$EntityNameKebab"
}

Write-Host "Output Path: $OutputPath" -ForegroundColor Yellow
Write-Host ""

# Check if output directory exists
if (Test-Path $OutputPath) {
    Write-Host "Warning: Directory already exists: $OutputPath" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Cancelled by user" -ForegroundColor Red
        exit 0
    }
}

# Create output directory
Write-Host "Creating directory structure..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
New-Item -ItemType Directory -Path "$OutputPath/entities" -Force | Out-Null
New-Item -ItemType Directory -Path "$OutputPath/dto" -Force | Out-Null

# Template files
$templates = @{
    "service" = @{
        "template" = "templates/service.template.ts"
        "output" = "$OutputPath/$EntityNameKebab.service.ts"
    }
    "module" = @{
        "template" = "templates/module.template.ts"
        "output" = "$OutputPath/$EntityNameKebab.module.ts"
    }
    "controller" = @{
        "template" = "templates/controller.template.ts"
        "output" = "$OutputPath/$EntityNameKebab.controller.ts"
    }
    "test" = @{
        "template" = "templates/service.spec.template.ts"
        "output" = "$OutputPath/$EntityNameKebab.service.spec.ts"
    }
}

# Generate files
Write-Host "Generating files..." -ForegroundColor Cyan
$generatedFiles = @()

foreach ($key in $templates.Keys) {
    $template = $templates[$key]
    $templatePath = $template.template
    $outputFilePath = $template.output
    
    Write-Host "  - Generating $key..."
    
    if (-not (Test-Path $templatePath)) {
        Write-Host "    Error: Template not found: $templatePath" -ForegroundColor Red
        continue
    }
    
    $content = Get-Content -Path $templatePath -Raw
    $content = Replace-Placeholders -Content $content `
        -EntityName $EntityName `
        -EntityNameKebab $EntityNameKebab `
        -EntityNameCamel $EntityNameCamel
    
    Set-Content -Path $outputFilePath -Value $content -NoNewline
    
    $generatedFiles += $outputFilePath
    Write-Host "    Created: $outputFilePath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Generating DTO placeholders..." -ForegroundColor Cyan

# Create DTO content
$createDtoLines = @(
    "import { IsString, IsNotEmpty, IsOptional } from 'class-validator';",
    "import { ApiProperty } from '@nestjs/swagger';",
    "",
    "export class Create${EntityName}Dto {",
    "  @ApiProperty({ description: 'Name', example: 'Example Name' })",
    "  @IsString()",
    "  @IsNotEmpty()",
    "  name: string;",
    "",
    "  @ApiProperty({ description: 'Description', required: false })",
    "  @IsString()",
    "  @IsOptional()",
    "  description?: string;",
    "}"
)

$updateDtoLines = @(
    "import { PartialType } from '@nestjs/swagger';",
    "import { Create${EntityName}Dto } from './create-${EntityNameKebab}.dto';",
    "",
    "export class Update${EntityName}Dto extends PartialType(Create${EntityName}Dto) {}"
)

$createDtoContent = $createDtoLines -join "`n"
$updateDtoContent = $updateDtoLines -join "`n"

Set-Content -Path "$OutputPath/dto/create-$EntityNameKebab.dto.ts" -Value $createDtoContent -NoNewline
Set-Content -Path "$OutputPath/dto/update-$EntityNameKebab.dto.ts" -Value $updateDtoContent -NoNewline

Write-Host "  Created: $OutputPath/dto/create-$EntityNameKebab.dto.ts" -ForegroundColor Green
Write-Host "  Created: $OutputPath/dto/update-$EntityNameKebab.dto.ts" -ForegroundColor Green

$generatedFiles += "$OutputPath/dto/create-$EntityNameKebab.dto.ts"
$generatedFiles += "$OutputPath/dto/update-$EntityNameKebab.dto.ts"

Write-Host ""
Write-Host "Generating Entity placeholder..." -ForegroundColor Cyan

$entityLines = @(
    "import { Entity, Column, Index } from 'typeorm';",
    "import { BaseEntity } from '@/common/entities/base.entity';",
    "",
    "@Entity('${EntityNameKebab}s')",
    "@Index(['tenantId', 'name'])",
    "export class $EntityName extends BaseEntity {",
    "  @Column()",
    "  name: string;",
    "",
    "  @Column({ type: 'text', nullable: true })",
    "  description?: string;",
    "",
    "  @Column({ default: 'active' })",
    "  status: string;",
    "}"
)

$entityContent = $entityLines -join "`n"

Set-Content -Path "$OutputPath/entities/$EntityNameKebab.entity.ts" -Value $entityContent -NoNewline
Write-Host "  Created: $OutputPath/entities/$EntityNameKebab.entity.ts" -ForegroundColor Green

$generatedFiles += "$OutputPath/entities/$EntityNameKebab.entity.ts"

Write-Host ""
Write-Host "CRUD Module Generated Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated Files:" -ForegroundColor Yellow
foreach ($file in $generatedFiles) {
    Write-Host "  - $file"
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update entity file"
Write-Host "  2. Update DTOs"
Write-Host "  3. Add business logic to service"
Write-Host "  4. Add custom endpoints to controller"
Write-Host "  5. Update tests"
Write-Host "  6. Import module in parent module"
Write-Host ""
Write-Host "Documentation: templates/README.md" -ForegroundColor Cyan
Write-Host "Time Saved: ~2 hours" -ForegroundColor Green
Write-Host ""
