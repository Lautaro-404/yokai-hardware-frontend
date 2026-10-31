@echo off
set "MAVEN_CMD=C:\Users\World\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"
if exist "pom.xml" (
    set "POM_ARG="
) else (
    set "POM_ARG=-f server\pom.xml"
)
if exist "%MAVEN_CMD%" (
    "%MAVEN_CMD%" %POM_ARG% %*
) else (
    mvn %POM_ARG% %*
)
