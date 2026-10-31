#!/bin/sh
if [ -f "pom.xml" ]; then
    POM_ARG=""
else
    POM_ARG="-f server/pom.xml"
fi
if command -v mvn >/dev/null 2>&1; then
    exec mvn $POM_ARG "$@"
else
    echo "Maven no encontrado en PATH. Por favor instala Maven o configúralo en PATH."
    exit 1
fi
