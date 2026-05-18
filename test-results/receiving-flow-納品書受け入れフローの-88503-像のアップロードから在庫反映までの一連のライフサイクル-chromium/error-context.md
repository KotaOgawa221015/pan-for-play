# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: receiving-flow.spec.ts >> 納品書受け入れフローのE2Eテスト >> 納品書画像のアップロードから在庫反映までの一連のライフサイクル
- Location: tests/system/receiving-flow.spec.ts:5:5

# Error details

```
TypeError: page.getByDisplayValue is not a function
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - heading "管理画面" [level=1] [ref=e5]
      - link "サイトのQRコードを発行" [ref=e6] [cursor=pointer]:
        - /url: /admin/qr
      - link "戻る" [ref=e7] [cursor=pointer]:
        - /url: /
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - heading "画像アップロード" [level=2] [ref=e11]
          - paragraph [ref=e12]: PNG の納品書画像を選択すると、読取結果をレビュー用モーダルで確認できます。
        - generic [ref=e13]:
          - generic [ref=e14]:
            - paragraph [ref=e15]: 納品書全体が写り、文字と数量がまっすぐ見える画像を使ってください。
            - generic [ref=e16]:
              - figure [ref=e17]:
                - img "読み取りに適した納品書画像の例 1" [ref=e18]
              - figure [ref=e19]:
                - img "読み取りに適した納品書画像の例 2" [ref=e20]
              - figure [ref=e21]:
                - img "読み取りに適した納品書画像の例 3" [ref=e22]
          - generic [ref=e23]:
            - generic [ref=e24]: 撮影した納品書の画像を選択してください
            - button "撮影した納品書の画像を選択してください" [ref=e25] [cursor=pointer]
          - button "アップロードして読み込む" [ref=e26]
      - generic [ref=e27]:
        - generic [ref=e28]:
          - heading "直近の読み取り履歴" [level=2] [ref=e29]
          - paragraph [ref=e30]: 読み取り済み納品書の確認と、必要に応じた再公開をここで扱います。
        - generic [ref=e31]:
          - article [ref=e32]:
            - generic [ref=e33]:
              - generic [ref=e34]:
                - generic [ref=e35]:
                  - heading "sample1.png" [level=3] [ref=e36]
                  - generic [ref=e37]: レビュー待ち
                - generic [ref=e38]:
                  - generic [ref=e39]:
                    - term [ref=e40]: 作成
                    - definition [ref=e41]: 2026/05/18 15:41
                  - generic [ref=e42]:
                    - term [ref=e43]: 最終公開
                    - definition [ref=e44]: 未実行
                  - generic [ref=e45]:
                    - term [ref=e46]: 公開者
                    - definition [ref=e47]: 未公開
                  - generic [ref=e48]:
                    - term [ref=e49]: 公開回数
                    - definition [ref=e50]: 0 回
                  - generic [ref=e51]:
                    - term [ref=e52]: 商品行数
                    - definition [ref=e53]: 11 行
                - list [ref=e54]:
                  - listitem [ref=e55]: カマンベールノア x19
                  - listitem [ref=e56]: 柚子胡板ベーコンエビピ x19
                  - listitem [ref=e57]: タマゴパン x19
                  - listitem [ref=e58]: 北海道スイートコーンパン x19
                  - listitem [ref=e59]: アールグレイミルクティベーグル x19
                  - listitem [ref=e60]: 塩あんバターパン x19
              - button "削除" [ref=e62]
          - article [ref=e63]:
            - generic [ref=e64]:
              - generic [ref=e65]:
                - generic [ref=e66]:
                  - heading "invoice-2026-05-10.jpg" [level=3] [ref=e67]
                  - generic [ref=e68]: レビュー待ち
                - generic [ref=e69]:
                  - generic [ref=e70]:
                    - term [ref=e71]: 作成
                    - definition [ref=e72]: 2026/05/18 13:01
                  - generic [ref=e73]:
                    - term [ref=e74]: 最終公開
                    - definition [ref=e75]: 2026/05/18 12:31
                  - generic [ref=e76]:
                    - term [ref=e77]: 公開者
                    - definition [ref=e78]: admin
                  - generic [ref=e79]:
                    - term [ref=e80]: 公開回数
                    - definition [ref=e81]: 1 回
                  - generic [ref=e82]:
                    - term [ref=e83]: 商品行数
                    - definition [ref=e84]: 11 行
                - list [ref=e85]:
                  - listitem [ref=e86]: 焼きカレーパン x19
                  - listitem [ref=e87]: 抹茶&ホワイトチョコのベーグル x19
                  - listitem [ref=e88]: 濃厚チーズクロワッサン x19
                  - listitem [ref=e89]: よもぎ太郎 x19
                  - listitem [ref=e90]: ペパロニトマトのごちそうピザパン x19
                  - listitem [ref=e91]: ふわふわお抹茶メロンパン x19
              - generic [ref=e93]: 現在公開中
          - article [ref=e94]:
            - generic [ref=e95]:
              - generic [ref=e96]:
                - generic [ref=e97]:
                  - heading "invoice-2026-04-07.jpg" [level=3] [ref=e98]
                  - generic [ref=e99]: レビュー待ち
                - generic [ref=e100]:
                  - generic [ref=e101]:
                    - term [ref=e102]: 作成
                    - definition [ref=e103]: 2026/05/18 13:01
                  - generic [ref=e104]:
                    - term [ref=e105]: 最終公開
                    - definition [ref=e106]: 2026/05/15 13:06
                  - generic [ref=e107]:
                    - term [ref=e108]: 公開者
                    - definition [ref=e109]: admin
                  - generic [ref=e110]:
                    - term [ref=e111]: 公開回数
                    - definition [ref=e112]: 1 回
                  - generic [ref=e113]:
                    - term [ref=e114]: 商品行数
                    - definition [ref=e115]: 11 行
                - list [ref=e116]:
                  - listitem [ref=e117]: ふわふわコーヒーメロンパン x8
                  - listitem [ref=e118]: ふわとろチーズパン x7
                  - listitem [ref=e119]: 天然酵母ガーリックフランス x6
                  - listitem [ref=e120]: 3種のチーズパン x5
                  - listitem [ref=e121]: ふんわりツナマヨパン x4
                  - listitem [ref=e122]: ゲランドの塩パン x3
              - button "この納品書を再公開する" [ref=e124]
      - generic [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]:
            - paragraph [ref=e129]: Delivery Note Review
            - heading "sample1.png" [level=2] [ref=e130]
          - button "閉じる" [ref=e131]
        - generic [ref=e133]:
          - generic [ref=e134]:
            - generic [ref=e135]: 商品名と数量を確認します。既存の商品名ならその商品を更新し、未登録の商品名なら新しく登録します。
            - generic [ref=e136]:
              - generic [ref=e137]:
                - generic [ref=e138]:
                  - generic [ref=e139]:
                    - paragraph [ref=e140]: Line 1
                    - paragraph [ref=e141]: "状態: 十分に残っている"
                  - generic [ref=e142]: 新しい商品として登録
                - generic [ref=e143]:
                  - generic [ref=e144]:
                    - text: 商品名
                    - textbox "商品名" [ref=e145]: カマンベールノア
                  - generic [ref=e146]:
                    - text: 数量
                    - spinbutton "数量" [ref=e147]: "19"
                  - generic [ref=e148]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e149]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e150]:
                - generic [ref=e151]:
                  - generic [ref=e152]:
                    - paragraph [ref=e153]: Line 2
                    - paragraph [ref=e154]: "状態: 十分に残っている"
                  - generic [ref=e155]: 新しい商品として登録
                - generic [ref=e156]:
                  - generic [ref=e157]:
                    - text: 商品名
                    - textbox "商品名" [ref=e158]: 柚子胡板ベーコンエビピ
                  - generic [ref=e159]:
                    - text: 数量
                    - spinbutton "数量" [ref=e160]: "19"
                  - generic [ref=e161]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e162]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e163]:
                - generic [ref=e164]:
                  - generic [ref=e165]:
                    - paragraph [ref=e166]: Line 3
                    - paragraph [ref=e167]: "状態: 十分に残っている"
                  - generic [ref=e168]: 新しい商品として登録
                - generic [ref=e169]:
                  - generic [ref=e170]:
                    - text: 商品名
                    - textbox "商品名" [ref=e171]: タマゴパン
                  - generic [ref=e172]:
                    - text: 数量
                    - spinbutton "数量" [ref=e173]: "19"
                  - generic [ref=e174]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e175]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e176]:
                - generic [ref=e177]:
                  - generic [ref=e178]:
                    - paragraph [ref=e179]: Line 4
                    - paragraph [ref=e180]: "状態: 十分に残っている"
                  - generic [ref=e181]: 新しい商品として登録
                - generic [ref=e182]:
                  - generic [ref=e183]:
                    - text: 商品名
                    - textbox "商品名" [ref=e184]: 北海道スイートコーンパン
                  - generic [ref=e185]:
                    - text: 数量
                    - spinbutton "数量" [ref=e186]: "19"
                  - generic [ref=e187]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e188]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e189]:
                - generic [ref=e190]:
                  - generic [ref=e191]:
                    - paragraph [ref=e192]: Line 5
                    - paragraph [ref=e193]: "状態: 十分に残っている"
                  - generic [ref=e194]: 新しい商品として登録
                - generic [ref=e195]:
                  - generic [ref=e196]:
                    - text: 商品名
                    - textbox "商品名" [ref=e197]: アールグレイミルクティベーグル
                  - generic [ref=e198]:
                    - text: 数量
                    - spinbutton "数量" [ref=e199]: "19"
                  - generic [ref=e200]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e201]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e202]:
                - generic [ref=e203]:
                  - generic [ref=e204]:
                    - paragraph [ref=e205]: Line 6
                    - paragraph [ref=e206]: "状態: 十分に残っている"
                  - generic [ref=e207]: 新しい商品として登録
                - generic [ref=e208]:
                  - generic [ref=e209]:
                    - text: 商品名
                    - textbox "商品名" [ref=e210]: 塩あんバターパン
                  - generic [ref=e211]:
                    - text: 数量
                    - spinbutton "数量" [ref=e212]: "19"
                  - generic [ref=e213]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e214]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e215]:
                - generic [ref=e216]:
                  - generic [ref=e217]:
                    - paragraph [ref=e218]: Line 7
                    - paragraph [ref=e219]: "状態: 十分に残っている"
                  - generic [ref=e220]: 新しい商品として登録
                - generic [ref=e221]:
                  - generic [ref=e222]:
                    - text: 商品名
                    - textbox "商品名" [ref=e223]: スパニッシュカステラ
                  - generic [ref=e224]:
                    - text: 数量
                    - spinbutton "数量" [ref=e225]: "18"
                  - generic [ref=e226]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e227]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e228]:
                - generic [ref=e229]:
                  - generic [ref=e230]:
                    - paragraph [ref=e231]: Line 8
                    - paragraph [ref=e232]: "状態: 十分に残っている"
                  - generic [ref=e233]: 新しい商品として登録
                - generic [ref=e234]:
                  - generic [ref=e235]:
                    - text: 商品名
                    - textbox "商品名" [ref=e236]: 鳴門金時のもっちりリュスティック
                  - generic [ref=e237]:
                    - text: 数量
                    - spinbutton "数量" [ref=e238]: "18"
                  - generic [ref=e239]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e240]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e241]:
                - generic [ref=e242]:
                  - generic [ref=e243]:
                    - paragraph [ref=e244]: Line 9
                    - paragraph [ref=e245]: "状態: 残り少し"
                  - generic [ref=e246]: 新しい商品として登録
                - generic [ref=e247]:
                  - generic [ref=e248]:
                    - text: 商品名
                    - textbox "商品名" [ref=e249]: クラムテャウダー
                  - generic [ref=e250]:
                    - text: 数量
                    - spinbutton "数量" [ref=e251]: "3"
                  - generic [ref=e252]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e253]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e254]:
                - generic [ref=e255]:
                  - generic [ref=e256]:
                    - paragraph [ref=e257]: Line 10
                    - paragraph [ref=e258]: "状態: 残り少し"
                  - generic [ref=e259]: 新しい商品として登録
                - generic [ref=e260]:
                  - generic [ref=e261]:
                    - text: 商品名
                    - textbox "商品名" [ref=e262]: オミオングラタンスープ
                  - generic [ref=e263]:
                    - text: 数量
                    - spinbutton "数量" [ref=e264]: "3"
                  - generic [ref=e265]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e266]:
                      - option "パン" [selected]
                      - option "スープ"
              - generic [ref=e267]:
                - generic [ref=e268]:
                  - generic [ref=e269]:
                    - paragraph [ref=e270]: Line 11
                    - paragraph [ref=e271]: "状態: 残り少し"
                  - generic [ref=e272]: "既存商品: ミネストローネ"
                - generic [ref=e273]:
                  - generic [ref=e274]:
                    - text: 商品名
                    - textbox "商品名" [ref=e275]: ミネストローネ
                  - generic [ref=e276]:
                    - text: 数量
                    - spinbutton "数量" [ref=e277]: "3"
                  - generic [ref=e278]:
                    - text: カテゴリ
                    - combobox "カテゴリ" [ref=e279]:
                      - option "パン"
                      - option "スープ" [selected]
          - complementary [ref=e280]:
            - img "アップロードした納品書" [ref=e282]
            - generic [ref=e283]:
              - generic [ref=e284]:
                - paragraph [ref=e285]: 読み取り一覧
                - paragraph [ref=e286]: 全 11 件
              - generic [ref=e287]:
                - paragraph [ref=e288]: 既存 1 件
                - paragraph [ref=e289]: 新規 10 件
            - generic [ref=e290]:
              - button "1 カマンベールノア 19 新規" [ref=e291]:
                - generic [ref=e292]: "1"
                - generic [ref=e293]: カマンベールノア
                - generic [ref=e294]: "19"
                - generic [ref=e295]: 新規
              - button "2 柚子胡板ベーコンエビピ 19 新規" [ref=e296]:
                - generic [ref=e297]: "2"
                - generic [ref=e298]: 柚子胡板ベーコンエビピ
                - generic [ref=e299]: "19"
                - generic [ref=e300]: 新規
              - button "3 タマゴパン 19 新規" [ref=e301]:
                - generic [ref=e302]: "3"
                - generic [ref=e303]: タマゴパン
                - generic [ref=e304]: "19"
                - generic [ref=e305]: 新規
              - button "4 北海道スイートコーンパン 19 新規" [ref=e306]:
                - generic [ref=e307]: "4"
                - generic [ref=e308]: 北海道スイートコーンパン
                - generic [ref=e309]: "19"
                - generic [ref=e310]: 新規
              - button "5 アールグレイミルクティベーグル 19 新規" [ref=e311]:
                - generic [ref=e312]: "5"
                - generic [ref=e313]: アールグレイミルクティベーグル
                - generic [ref=e314]: "19"
                - generic [ref=e315]: 新規
              - button "6 塩あんバターパン 19 新規" [ref=e316]:
                - generic [ref=e317]: "6"
                - generic [ref=e318]: 塩あんバターパン
                - generic [ref=e319]: "19"
                - generic [ref=e320]: 新規
              - button "7 スパニッシュカステラ 18 新規" [ref=e321]:
                - generic [ref=e322]: "7"
                - generic [ref=e323]: スパニッシュカステラ
                - generic [ref=e324]: "18"
                - generic [ref=e325]: 新規
              - button "8 鳴門金時のもっちりリュスティック 18 新規" [ref=e326]:
                - generic [ref=e327]: "8"
                - generic [ref=e328]: 鳴門金時のもっちりリュスティック
                - generic [ref=e329]: "18"
                - generic [ref=e330]: 新規
              - button "9 クラムテャウダー 3 新規" [ref=e331]:
                - generic [ref=e332]: "9"
                - generic [ref=e333]: クラムテャウダー
                - generic [ref=e334]: "3"
                - generic [ref=e335]: 新規
              - button "10 オミオングラタンスープ 3 新規" [ref=e336]:
                - generic [ref=e337]: "10"
                - generic [ref=e338]: オミオングラタンスープ
                - generic [ref=e339]: "3"
                - generic [ref=e340]: 新規
              - button "11 ミネストローネ 3 既存" [ref=e341]:
                - generic [ref=e342]: "11"
                - generic [ref=e343]: ミネストローネ
                - generic [ref=e344]: "3"
                - generic [ref=e345]: 既存
        - generic [ref=e346]:
          - paragraph [ref=e347]: 11 件の読取結果をレビュー中
          - button "内容を反映する" [ref=e348]
  - button "Open Next.js Dev Tools" [ref=e354] [cursor=pointer]:
    - img [ref=e355]
  - alert [ref=e358]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import path from 'node:path';
  3  | 
  4  | test.describe('納品書受け入れフローのE2Eテスト', () => {
  5  |     test('納品書画像のアップロードから在庫反映までの一連のライフサイクル', async ({ page }) => {
  6  |         await page.goto('/login');
  7  |         await page.getByRole('button', { name: '管理者 (Bypass)' }).click();
  8  |         await expect(page).toHaveURL('/');
  9  | 
  10 |         await page.goto('/admin');
  11 | 
  12 |         const filePath = path.join(process.cwd(), 'public/receiving-examples/sample1.png');
  13 | 
  14 |         await page.setInputFiles('input[type="file"]', filePath);
  15 |         await page.getByRole('button', { name: 'アップロードして読み込む' }).click();
  16 | 
  17 |         const modalTitle = page.getByText('Delivery Note Review');
  18 |         await expect(modalTitle).toBeVisible({ timeout: 30000 });
> 19 |         await expect(page.getByDisplayValue('カマンベールノア')).toBeVisible();
     |                           ^ TypeError: page.getByDisplayValue is not a function
  20 |         await expect(page.getByDisplayValue('クラムチャウダー')).toBeVisible();
  21 | 
  22 |         await page.getByRole('button', { name: '内容を反映する' }).click();
  23 |         await expect(modalTitle).not.toBeVisible();
  24 | 
  25 |         await page.goto('/');
  26 | 
  27 |         const soupCard = page.locator('div').filter({
  28 |             has: page.getByRole('heading', { name: 'クラムチャウダー' })
  29 |         });
  30 | 
  31 |         await expect(soupCard).toBeVisible();
  32 |         await expect(soupCard.getByText('残りわずか')).toBeVisible();
  33 |         await expect(soupCard.getByText('3 個')).toBeVisible();
  34 |     });
  35 | });
```