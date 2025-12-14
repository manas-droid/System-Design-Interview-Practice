## Login with CURL:

Login as test user : nora_lopez0@newsfeed.dev

```
LOGIN_JSON=$(curl -s http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -c refresh-nora.cookie \
  -d '{"email":"nora_lopez0@newsfeed.dev","password":"NewsfeedPass123!"}')
echo "$LOGIN_JSON" | jq
ACCESS_TOKEN=$(echo "$LOGIN_JSON" | jq -r '.accessToken')
```


## Test Post Endpoint with CURL:

```
curl -i http://localhost:3000/api/post \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
        "content": "Nora’s post from curl",
        "photoURL": "https://picsum.photos/seed/nora/400"
      }'

```
