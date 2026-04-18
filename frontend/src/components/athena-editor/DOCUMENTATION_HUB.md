# Athena Editor — Documentation Hub

Welcome to the complete documentation for Athena Editor, a production-grade, AI-powered document editor with real-time collaboration.

---

## 📚 Available Documentation

### 1. [Complete Technical Documentation](DOCUMENTATION.md) (1,904 lines)
**For**: Developers, architects, technical leads

**Covers**:
- Core editor architecture
- All TipTap extensions (8 custom extensions)
- Text formatting features (11+ features)
- Pagination engine (32.9KB implementation)
- AI-powered features (7 AI functions + assistants)
- Real-time collaboration (Yjs CRDTs)
- Document management (CRUD operations)
- Export system (6 formats)
- UI components (24+ components)
- Custom hooks (8 hooks)
- Context providers (Editor, Image)
- Utility functions (12 utilities)
- Keyboard shortcuts (40+ shortcuts)
- API integration (20+ endpoints)
- Performance optimizations
- File structures
- Integration patterns
- Troubleshooting guide

**Use When**: You need comprehensive technical reference for development

---

### 2. [API Reference Guide](API_REFERENCE.md) (1,242 lines)
**For**: Backend developers, API integrators, frontend developers

**Covers**:
- Authentication (JWT tokens)
- Document Management APIs (6 endpoints)
- Comment APIs (4 endpoints)
- AI-Powered APIs (5 endpoints + streaming)
- Analytics APIs (5 endpoints)
- WebSocket Events (real-time collaboration)
- Error codes and handling
- Rate limiting
- Code examples (JavaScript, Python, cURL, Axios)
- Data models
- SDK usage

**Use When**: You're integrating with the backend or building API clients

---

### 3. [Extension Development Guide](EXTENSION_DEVELOPMENT_GUIDE.md) (1,317 lines)
**For**: Plugin developers, custom extension creators

**Covers**:
- Extension architecture (Nodes, Marks, Extensions)
- Creating custom nodes (with real examples)
- Creating custom marks (with real examples)
- Creating custom extensions
- Node views with React (interactive components)
- Custom commands (simple, chainable, complex)
- ProseMirror plugins (event handlers, filtering)
- Editor hooks (state management, actions)
- Utility functions (content helpers, pagination)
- Testing extensions (unit, integration)
- Performance best practices
- Common patterns (Singleton, Observer, Factory)
- Debugging tips

**Use When**: You're building custom TipTap extensions or modifying editor behavior

---

### 4. [User Manual & Feature Guide](USER_MANUAL.md) (845 lines)
**For**: End users, writers, editors, content creators

**Covers**:
- Getting started (interface overview)
- Basic editing (typing, navigation, selection)
- Text formatting (bold, italic, headings, fonts, colors)
- Page layout (pagination, setup, zoom)
- Inserting content (images, tables, links, code)
- AI-powered features (writing assistant, transformations, voice typing)
- Collaboration (real-time editing, sharing, presence)
- Comments & reviews (adding, replying, resolving)
- Find & replace (basic, advanced, regex)
- Export & download (PDF, DOCX, HTML, TXT, EPUB, Markdown)
- Keyboard shortcuts (complete reference)
- Settings & preferences
- Tips & tricks
- Troubleshooting

**Use When**: You're learning to use the editor or need feature documentation

---

### 5. [Real-Time Sync Architecture Research](SYNC_RESEARCH_AND_VALIDATION.md) (879 lines)
**For**: Architects, senior developers, collaboration implementers

**Covers**:
- 6 critical conflicts analysis (why original plan failed)
- Two-layer architecture (Content vs Pagination)
- Yjs CRDT integration
- Socket.io vs y-websocket comparison
- Transaction filtering (preventing pagination sync)
- Awareness protocol (cursor presence)
- Persistence strategy (IndexedDB, MongoDB, Beacon API)
- Migration strategy (backward compatibility)
- Edge cases (network, concurrency, performance)
- Security (authentication, authorization, rate limiting)
- Testing strategy (unit, integration, load tests)
- Monitoring & observability
- Implementation roadmap (8-week plan)

**Use When**: Implementing real-time collaboration or understanding sync architecture

---

## 🎯 Quick Navigation by Task

### I want to...

**Use the editor as a user**:
→ Read [USER_MANUAL.md](USER_MANUAL.md)

**Build a custom extension**:
→ Read [EXTENSION_DEVELOPMENT_GUIDE.md](EXTENSION_DEVELOPMENT_GUIDE.md)

**Integrate with the API**:
→ Read [API_REFERENCE.md](API_REFERENCE.md)

**Understand how the editor works**:
→ Read [DOCUMENTATION.md](DOCUMENTATION.md)

**Implement real-time collaboration**:
→ Read [SYNC_RESEARCH_AND_VALIDATION.md](SYNC_RESEARCH_AND_VALIDATION.md)

**Find keyboard shortcuts**:
→ See Section 11 in [USER_MANUAL.md](USER_MANUAL.md#11-keyboard-shortcuts)

**Troubleshoot an issue**:
→ See Section 14 in [USER_MANUAL.md](USER_MANUAL.md#14-troubleshooting)
→ See Appendix D in [DOCUMENTATION.md](DOCUMENTATION.md#appendix-d-troubleshooting)

**Add a new AI feature**:
→ See Section 5 in [DOCUMENTATION.md](DOCUMENTATION.md#5-ai-powered-features)
→ See Appendix C.2 in [EXTENSION_DEVELOPMENT_GUIDE.md](EXTENSION_DEVELOPMENT_GUIDE.md#c2-adding-a-new-ai-function)

**Export documents**:
→ See Section 10 in [USER_MANUAL.md](USER_MANUAL.md#10-export--download)
→ See Section 8 in [DOCUMENTATION.md](DOCUMENTATION.md#8-export-system)

---

## 📊 Documentation Statistics

| Document | Lines | Target Audience | Last Updated |
|----------|-------|----------------|--------------|
| DOCUMENTATION.md | 1,904 | Developers | April 17, 2026 |
| API_REFERENCE.md | 1,242 | API Integrators | April 17, 2026 |
| EXTENSION_DEVELOPMENT_GUIDE.md | 1,317 | Extension Developers | April 17, 2026 |
| USER_MANUAL.md | 845 | End Users | April 17, 2026 |
| SYNC_RESEARCH_AND_VALIDATION.md | 879 | Architects | April 17, 2026 |
| **TOTAL** | **6,187** | **All Roles** | **April 17, 2026** |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Athena Editor Stack                       │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                          │
│  - React 19 Components                                       │
│  - TipTap 3.x Editor                                         │
│  - Radix UI Components                                       │
│  - Tailwind CSS                                              │
├─────────────────────────────────────────────────────────────┤
│  Collaboration Layer                                         │
│  - Yjs CRDTs                                                 │
│  - Socket.io WebSockets                                      │
│  - IndexedDB (Offline)                                       │
│  - Awareness Protocol                                        │
├─────────────────────────────────────────────────────────────┤
│  AI Layer                                                    │
│  - OpenAI GPT-4o-mini                                        │
│  - Streaming Responses                                       │
│  - Token Counting                                            │
│  - Quota Management                                          │
├─────────────────────────────────────────────────────────────┤
│  Backend Layer                                               │
│  - Node.js + Express                                         │
│  - MongoDB (Document Storage)                                │
│  - JWT Authentication                                        │
│  - AI Usage Tracking                                         │
├─────────────────────────────────────────────────────────────┤
│  Pagination Engine                                           │
│  - Content-aware page breaks                                 │
│  - Local-only (never synced)                                 │
│  - Viewport-specific                                         │
│  - Debounced (500ms)                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### For Developers

1. **Read**: [DOCUMENTATION.md](DOCUMENTATION.md) - Understand the architecture
2. **Setup**: Clone repository, install dependencies
3. **Explore**: Run development server, explore codebase
4. **Extend**: Use [EXTENSION_DEVELOPMENT_GUIDE.md](EXTENSION_DEVELOPMENT_GUIDE.md) to build custom features
5. **Integrate**: Use [API_REFERENCE.md](API_REFERENCE.md) for backend integration

### For End Users

1. **Read**: [USER_MANUAL.md](USER_MANUAL.md) - Learn to use the editor
2. **Practice**: Create a test document
3. **Explore**: Try different features (formatting, AI, export)
4. **Collaborate**: Share a document with a colleague
5. **Master**: Learn keyboard shortcuts for productivity

### For Architects

1. **Read**: [SYNC_RESEARCH_AND_VALIDATION.md](SYNC_RESEARCH_AND_VALIDATION.md) - Understand collaboration architecture
2. **Review**: Analyze the two-layer architecture (Content vs Pagination)
3. **Plan**: Use implementation roadmap for rollout
4. **Validate**: Review conflict analysis and mitigations
5. **Implement**: Follow phased deployment strategy

---

## 📖 Documentation Conventions

### Code Blocks

**JavaScript**:
```javascript
const editor = useEditor({ ... });
```

**API Request**:
```json
{
  "title": "My Document",
  "data": { ... }
}
```

**Terminal**:
```bash
npm install
npm run dev
```

### Callout Boxes

✅ **Best Practice**: Recommended approach

⚠️ **Warning**: Potential issue to avoid

❌ **Don't**: Common mistake

💡 **Tip**: Helpful hint

---

## 🔍 Searching Documentation

### By Keyword

- **Extensions**: Search for "Extension" in [DOCUMENTATION.md](DOCUMENTATION.md) Section 2
- **API**: Search for "Endpoint" in [API_REFERENCE.md](API_REFERENCE.md)
- **AI**: Search for "AI" in [DOCUMENTATION.md](DOCUMENTATION.md) Section 5
- **Pagination**: Search for "Pagination" in [DOCUMENTATION.md](DOCUMENTATION.md) Section 4
- **Collaboration**: Search for "Collaboration" in [SYNC_RESEARCH_AND_VALIDATION.md](SYNC_RESEARCH_AND_VALIDATION.md)

### By File

- **Components**: `components/athena-editor/components/`
- **Extensions**: `components/athena-editor/extensions/`
- **Hooks**: `components/athena-editor/hooks/`
- **Utils**: `components/athena-editor/utils/`
- **Backend**: `backend/`

---

## 🆘 Getting Help

### Documentation Issues

- **Missing information**: Create issue in repository
- **Incorrect information**: Submit pull request
- **Suggestions**: Contact documentation team

### Technical Support

- **Bug reports**: Help → Report Issue in editor
- **Feature requests**: Contact product team
- **General questions**: Check [USER_MANUAL.md](USER_MANUAL.md) Section 14

### Community

- **Forum**: Join user community
- **Discord**: Chat with developers
- **GitHub**: Contribute to codebase

---

## 📅 Version History

### v1.0.0 (April 17, 2026)
- Initial documentation release
- Complete technical documentation (1,904 lines)
- API reference guide (1,242 lines)
- Extension development guide (1,317 lines)
- User manual (845 lines)
- Sync architecture research (879 lines)

---

## 📝 Contributing to Documentation

### How to Contribute

1. **Fork** the repository
2. **Create** a branch for your changes
3. **Edit** documentation files (Markdown format)
4. **Test** links and code examples
5. **Submit** pull request

### Documentation Standards

- Use Markdown formatting
- Include code examples for technical concepts
- Add table of contents for documents > 500 lines
- Use consistent heading hierarchy (H1, H2, H3)
- Include last updated date at the end
- Cross-reference other documentation files

---

## 📊 Coverage Matrix

| Feature | DOCUMENTATION.md | API_REFERENCE.md | EXTENSION_GUIDE.md | USER_MANUAL.md | SYNC_RESEARCH.md |
|---------|------------------|------------------|-------------------|----------------|------------------|
| Editor Architecture | ✅ | | | | |
| Text Formatting | ✅ | | ✅ | ✅ | |
| AI Features | ✅ | ✅ | ✅ | ✅ | |
| Collaboration | ✅ | ✅ | | | ✅ |
| Pagination | ✅ | | ✅ | ✅ | ✅ |
| Export | ✅ | | | ✅ | |
| API Endpoints | | ✅ | | | |
| Extension Dev | ✅ | | ✅ | | |
| Keyboard Shortcuts | ✅ | | | ✅ | |
| Troubleshooting | ✅ | | | ✅ | |

---

## 🔗 Related Resources

### External Documentation

- **TipTap**: https://tiptap.dev/docs
- **ProseMirror**: https://prosemirror.net/docs/
- **Yjs**: https://docs.yjs.dev/
- **React**: https://react.dev/
- **Socket.io**: https://socket.io/docs/

### Internal Resources

- **Code Repository**: `/CanvaAI/frontend/src/components/athena-editor/`
- **Backend API**: `/CanvaAI/backend/`
- **Examples**: See code examples in all documentation files

---

## 📞 Contact

**Documentation Team**:
- Technical Writer: [Name]
- Lead Developer: [Name]
- Product Manager: [Name]

**Email**: docs@athena-editor.com  
**Slack**: #documentation  
**GitHub**: github.com/athena-editor/docs

---

**Documentation Hub Version**: 1.0.0  
**Last Updated**: April 17, 2026  
**Total Documentation**: 6,187 lines across 5 documents
