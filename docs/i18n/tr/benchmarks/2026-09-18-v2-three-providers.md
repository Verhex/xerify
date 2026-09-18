# Sağlayıcılar arası sonuçlar: 2026-09-18

`xerify-cross-provider-v2` · [Yöntem ve sınırlamalar](../benchmark.md) · [Türetilmiş ölçümler](../../../benchmarks/2026-09-18-v2-three-providers.json)

Ham sağlayıcı yanıtları yayımlanmaz. Sahibinin seçtiği üç sağlayıcı alt kümesi: geçmiş 144 ölçümden 72; Cursor yönleri çıkarıldı, yeniden çağrı yapılmadı.

| Yön                   | Eşleşme / çağrı | Atlanan | Geçerli | Hata | Bağlam eşleşmesi / çağrı | Yanlış confirmed | Fazladan unclear | Geçerli p50 / p95 ms | Giriş token (kapsama) | Çıkış token (kapsama) | USD (kapsama)              |
| --------------------- | --------------- | ------- | ------- | ---- | ------------------------ | ---------------- | ---------------- | -------------------- | --------------------- | --------------------- | -------------------------- |
| openai-to-anthropic   | 10/12           | 0       | 12      | 0    | 8/9                      | 0                | 2                | 73055 / 108271       | 178924 (12/12)        | 36477 (12/12)         | 2.6223577500000004 (12/12) |
| openai-to-typesafe    | 12/12           | 0       | 12      | 0    | 9/9                      | 0                | 0                | 794 / 1392           | 7375 (12/12)          | 500 (12/12)           | — (0/12)                   |
| anthropic-to-openai   | 10/12           | 0       | 12      | 0    | 8/9                      | 0                | 2                | 11296 / 19177        | 191012 (12/12)        | 2369 (12/12)          | — (0/12)                   |
| anthropic-to-typesafe | 12/12           | 0       | 12      | 0    | 9/9                      | 0                | 0                | 766 / 1074           | 7375 (12/12)          | 500 (12/12)           | — (0/12)                   |
| typesafe-to-openai    | 10/12           | 0       | 12      | 0    | 8/9                      | 0                | 2                | 10957 / 13510        | 191006 (12/12)        | 2241 (12/12)          | — (0/12)                   |
| typesafe-to-anthropic | 10/12           | 0       | 12      | 0    | 8/9                      | 0                | 2                | 77798 / 129163       | 177060 (12/12)        | 32718 (12/12)         | 2.7045484999999996 (12/12) |

Teknik hatalar, sonuçları unclear olsa bile teslim başarısını düşürür. Geçerli gecikme yüzdelikleri hatalı çağrıları dışlar; ayrı süreleri JSON içindedir. Eksik token/maliyet bilinmiyor demektir, sıfır değil. Raporlama kapsamı yoksa dolar karşılaştırması yapılamaz.

## Senaryo matrisi

| Senaryo             | Beklenen  | openai-to-anthropic | openai-to-typesafe | anthropic-to-openai | anthropic-to-typesafe | typesafe-to-openai | typesafe-to-anthropic |
| ------------------- | --------- | ------------------- | ------------------ | ------------------- | --------------------- | ------------------ | --------------------- |
| support             | confirmed | unclear             | confirmed          | unclear             | confirmed             | unclear            | unclear               |
| contradiction       | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| missing             | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| turkish             | confirmed | unclear             | confirmed          | unclear             | confirmed             | unclear            | unclear               |
| exception           | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| partial             | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| indirection         | confirmed | confirmed           | confirmed          | confirmed           | confirmed             | confirmed          | confirmed             |
| injection           | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| conflicting-sources | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| distractors         | confirmed | confirmed           | confirmed          | confirmed           | confirmed             | confirmed          | confirmed             |
| sql                 | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| unmeasured-outcome  | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |

Bunlar sentetik etiketlerle karşılaştırmadır, üretim doğruluğu tahmini değildir. Şema hatası kullanılabilir sonuç teslim edilemediğini gösterir; çözümlenemeyen cevabın doğruluğunu göstermez. Farklı beyan edilmiş kaynak kimlikleriyle aynı hedefe yapılan çağrılar aynı model girdisini kullanır. Sonuç çıkarmadan önce uyumsuzlukları inceleyin.
