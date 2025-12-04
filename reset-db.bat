@echo off
echo 🧹 Resetting database...
cd backend
call npx prisma migrate reset --force
echo ✅ Database reset complete!
echo.
echo 📋 Test Credentials:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo All users have password: test123
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Admin:     admin@test.com     ^| 1111111111
echo Manager:   manager@test.com   ^| 2222222222
echo Operator:  operator@test.com  ^| 3333333333
echo Delivery:  delivery@test.com  ^| 4444444444
echo Customer:  customer@test.com  ^| 5555555555
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pause
