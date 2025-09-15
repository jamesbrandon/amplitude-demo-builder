# Contributing to Amplitude Demo Builder

Thank you for your interest in contributing! This project helps the Amplitude community create better analytics demonstrations.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/amplitude-demo-builder.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the GitHub issue template
- Include reproduction steps
- Provide system information (OS, Node version)
- Include relevant logs or error messages

### 💡 Feature Requests
- Describe the use case and problem you're solving
- Explain the proposed solution
- Consider backward compatibility
- Provide examples if applicable

### 🏭 New Industry Templates
We welcome new industry configurations! Include:

1. **Industry Configuration** (`examples/your-industry-config.json`)
   - Company details and branding
   - Industry-specific scenarios and events
   - Realistic user journey stages
   - Attribution sources relevant to the industry

2. **Event Templates** (in `src/generators/event-generator.js`)
   - Add industry case to `getIndustrySpecificTemplates()`
   - Create method like `getYourIndustryTemplates()`
   - Include realistic event properties
   - Follow existing patterns for consistency

3. **Documentation**
   - Update README.md with industry description
   - Add example events and properties
   - Include typical use cases

### 📖 Documentation Improvements
- Fix typos and grammar
- Improve clarity and examples
- Add missing information
- Update outdated content

## 🛠️ Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and small

### Event Properties
- Follow Amplitude best practices
- Use realistic property names and values
- Include proper data types
- Avoid reserved Amplitude properties in event_properties

### Testing
- Test your changes with `npm start`
- Verify web generator works: `http://localhost:3001/generator`
- Test CLI generator: `npm run create-client-demo`
- Ensure generated demos start successfully

### Commit Messages
Use clear, descriptive commit messages:
```
feat: add gaming industry template with engagement events
fix: resolve UTM parameter encoding issue
docs: update README with new industry examples
```

## 📋 Pull Request Process

1. **Before Submitting**
   - Test your changes thoroughly
   - Update documentation if needed
   - Ensure no breaking changes
   - Run `npm install` to verify dependencies

2. **Pull Request**
   - Use the PR template
   - Describe what you changed and why
   - Include screenshots for UI changes
   - Reference related issues

3. **Review Process**
   - Maintainers will review your PR
   - Address feedback promptly
   - Keep discussions constructive
   - Be patient - reviews take time

## 🎨 Industry Template Guidelines

When creating new industry templates:

### Required Sections
```json
{
  "company": {
    "name": "Industry Demo Company",
    "industry": "your_industry",
    "description": "Brief description"
  },
  "scenarios": {
    "primary_scenario": {
      "name": "Primary Use Case",
      "events": ["Event 1", "Event 2", "Event 3"]
    }
  },
  "userJourney": {
    "stages": [
      {
        "name": "stage_name",
        "displayName": "Display Name",
        "conversionRate": 0.15
      }
    ]
  },
  "attribution": {
    "sources": [
      {
        "utm_source": "relevant_source",
        "utm_medium": "relevant_medium",
        "weight": 0.3
      }
    ]
  }
}
```

### Event Property Guidelines
- Use realistic property names
- Include industry-specific context
- Follow consistent naming (snake_case)
- Add proper data types and ranges
- Include revenue properties where applicable

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Focus on constructive feedback
- Celebrate contributions from all skill levels

## 📞 Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create a GitHub Issue
- **Ideas**: Start with a GitHub Discussion
- **Urgent Issues**: Tag maintainers in the issue

## 🙏 Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Invited to join the maintainer team (for significant contributions)

Thank you for helping make Amplitude demos better for everyone! 🎉