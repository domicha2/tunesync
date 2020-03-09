#!/usr/bin/env python3
import os
import sys
import cbsettings

if __name__ == "__main__":
    cbsettings.configure("tunesync_project.settings.factory.factory")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
