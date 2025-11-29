#!/bin/bash
for i in {1..20}; do
  result=$(curl -s -X DELETE http://localhost:3000/api/books/clear-all)
  books=$(echo "$result" | grep -o '"books":[0-9]*' | grep -o '[0-9]*')
  echo "第 $i 次删除,剩余: $books 本"
  if [ "$books" = "0" ]; then
    echo "✅ 数据库已清空!"
    break
  fi
  sleep 2
done
