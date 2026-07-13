#!/bin/bash
./nodebb upgrade
./nodebb start
tail -f logs/output.log
