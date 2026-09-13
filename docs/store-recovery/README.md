# Store recovery parts

Concatenate part0.txt..part4.txt in order to rebuild `src/lib/store.tsx`.

```bash
cat docs/store-recovery/part{0,1,2,3,4}.txt > src/lib/store.tsx
cp src/lib/store.tsx artifacts/bizim-vinc-erp/src/lib/store.tsx
```

Then commit the restored store.
