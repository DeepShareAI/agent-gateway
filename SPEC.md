# Agent Gateway

## Problem

Meta Muse asks for Gmail full access. Users want to use Meta Muse with full capability, but don't want to share the personal sensitive data blindly. 

## Solution

A gateway that connect to all personal private data sources (e.g. Gmail, Google Drive, Facebook, Twitter, Linkedin), review and approve minimal information to enable third-party agents (e.g. Meta Muse)'s maximal capability.

## Features

- Provide a MCP server for third-party agents
- Connect to different SSO accounts (e.g. Gmail)

## MVP

- Connect to Gmail
- Provide a MCP server for Meta Muse to retrieve contents
- Build an APP to review and approve the information request from Meta Muse
-- Review the information request and prepare the minimal infomation
-- Send the notification
-- Review the request and approve/decline
