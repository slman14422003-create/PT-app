#!/usr/bin/env bash
# ============================================================================
# يُشغَّل مرة واحدة فقط (محليًا أو داخل GitHub Codespace) لتوليد مفتاح توقيع
# التطبيق (Signing Key). هذا المفتاح ضروري لبناء APK قابل للتثبيت والتحديث،
# ويجب حفظه بأمان لأن فقدانه يعني عدم القدرة على نشر تحديثات لنفس التطبيق.
#
# الاستخدام:
#   bash scripts/generate-keystore.sh
# ============================================================================
set -euo pipefail

KEYSTORE_FILE="android.keystore"
ALIAS="androidkey"

if [ -f "$KEYSTORE_FILE" ]; then
  echo "⚠️  الملف $KEYSTORE_FILE موجود بالفعل. احذفه يدويًا فقط إذا كنت متأكدًا (سيمنع تحديث أي نسخة منشورة سابقًا)."
  exit 1
fi

echo "سيُطلب منك إدخال:"
echo "  1) كلمة مرور للـ Keystore (احفظها - هتحتاجها كسر GitHub Secret)"
echo "  2) بيانات وهمية للاسم/المؤسسة (اضغط Enter لتجاوزها أو اكتب أي قيمة)"
echo ""

keytool -genkeypair -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000

echo ""
echo "✅ تم إنشاء $KEYSTORE_FILE بنجاح."
echo ""
echo "───────────────────────────────────────────────────────────"
echo "الخطوة التالية: أضف الأسرار دي في GitHub"
echo "Settings → Secrets and variables → Actions → New repository secret"
echo "───────────────────────────────────────────────────────────"
echo ""
echo "1) ANDROID_KEYSTORE_BASE64 :"
base64 -w0 "$KEYSTORE_FILE" 2>/dev/null || base64 "$KEYSTORE_FILE"
echo ""
echo "2) ANDROID_KEYSTORE_PASSWORD : (نفس كلمة المرور اللي أدخلتها فوق)"
echo "3) ANDROID_KEY_ALIAS         : androidkey"
echo "4) ANDROID_KEY_PASSWORD      : (نفس كلمة مرور الـ Keystore عادة، إلا لو غيرتها)"
echo ""
echo "───────────────────────────────────────────────────────────"
echo "بصمة SHA256 (اللي هتحطها في .well-known/assetlinks.json):"
echo "───────────────────────────────────────────────────────────"
keytool -list -v -keystore "$KEYSTORE_FILE" -alias "$ALIAS" | grep "SHA256:"
echo ""
echo "⚠️  لا ترفع ملف $KEYSTORE_FILE نفسه على GitHub أبدًا - فقط الأسرار اللي طبعناها فوق."
echo "احتفظ بنسخة من $KEYSTORE_FILE في مكان آمن خارج المستودع (مثلاً مدير كلمات مرور)."
