const fs = require('fs');

const generatePostman = () => {
    const resources = ['users', 'topics', 'indicators', 'periods', 'assignments', 'results', 'evidence'];
    const items = resources.map(res => ({
        name: `CRUD ${res.toUpperCase()}`,
        item: [
            {
                name: `Get List with Pagination/Search (${res})`,
                request: {
                    method: 'GET',
                    header: [{ key: 'Authorization', value: 'Bearer {{token}}', type: 'text' }],
                    url: {
                        raw: `{{baseUrl}}/api/admin/crud/${res}?page=1&pageSize=10&sort=id:desc&q=`,
                        host: ['{{baseUrl}}'],
                        path: ['api', 'admin', 'crud', res],
                        query: [
                            { key: 'page', value: '1' },
                            { key: 'pageSize', value: '10' },
                            { key: 'sort', value: 'id:desc' },
                            { key: 'q', value: '' }
                        ]
                    }
                }
            },
            {
                name: `Create new (${res})`,
                request: {
                    method: 'POST',
                    header: [
                        { key: 'Authorization', value: 'Bearer {{token}}', type: 'text' },
                        { key: 'Content-Type', value: 'application/json', type: 'text' }
                    ],
                    body: {
                        mode: 'raw',
                        raw: "{}"
                    },
                    url: {
                        raw: `{{baseUrl}}/api/admin/crud/${res}`,
                        host: ['{{baseUrl}}'],
                        path: ['api', 'admin', 'crud', res]
                    }
                }
            },
            {
                name: `Get One by ID (${res})`,
                request: {
                    method: 'GET',
                    header: [{ key: 'Authorization', value: 'Bearer {{token}}', type: 'text' }],
                    url: {
                        raw: `{{baseUrl}}/api/admin/crud/${res}/1`,
                        host: ['{{baseUrl}}'],
                        path: ['api', 'admin', 'crud', res, '1']
                    }
                }
            },
            {
                name: `Update by ID (${res})`,
                request: {
                    method: 'PATCH',
                    header: [
                        { key: 'Authorization', value: 'Bearer {{token}}', type: 'text' },
                        { key: 'Content-Type', value: 'application/json', type: 'text' }
                    ],
                    body: {
                        mode: 'raw',
                        raw: "{}"
                    },
                    url: {
                        raw: `{{baseUrl}}/api/admin/crud/${res}/1`,
                        host: ['{{baseUrl}}'],
                        path: ['api', 'admin', 'crud', res, '1']
                    }
                }
            },
            {
                name: `Delete by ID (${res})`,
                request: {
                    method: 'DELETE',
                    header: [{ key: 'Authorization', value: 'Bearer {{token}}', type: 'text' }],
                    url: {
                        raw: `{{baseUrl}}/api/admin/crud/${res}/1`,
                        host: ['{{baseUrl}}'],
                        path: ['api', 'admin', 'crud', res, '1']
                    }
                }
            }
        ]
    }));

    const collection = {
        info: {
            name: "Personnel Assessment API - Complete CRUD Admin",
            description: "Postman Collection covering ALL generic CRUD for Users, Topics, Indicators, Periods (Evaluations), Assignments, Results, and Evidence with Pagination, Sorting, and Searching parameters as specified in check.txt.",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: items,
        variable: [
            { key: "baseUrl", value: "http://localhost:9999", type: "string" },
            { key: "token", value: "YOUR_ADMIN_TOKEN_HERE", type: "string" }
        ]
    };

    fs.writeFileSync('postman_crud_collection.json', JSON.stringify(collection, null, 2));
    console.log("Generated 'postman_crud_collection.json'");
};

generatePostman();
