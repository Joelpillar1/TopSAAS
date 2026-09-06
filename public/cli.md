# TopSAAS CLI & Programmatic Integration

Fetch SaaS product rankings and catalog data directly via standard terminal commands.

## Curl Examples

### 1. Fetch LLM Text Guide
```bash
curl -s https://topsaas.com/llms.txt
```

### 2. Fetch Markdown Directory
```bash
curl -s https://topsaas.com/catalog.md
```

### 3. Fetch JSON Directory
```bash
curl -s https://topsaas.com/products.json | jq '.[] | {rank, name, category, upvotes}'
```

### 4. Search Products with JQ
```bash
curl -s https://topsaas.com/products.json | jq '.[] | select(.category=="AI Tools")'
```
