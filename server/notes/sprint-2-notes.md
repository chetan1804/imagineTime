Imaginetime Design Sprint #2
Tuesday 9-24-19 to Thursday 9-26-19
Focus: Firm Management side of the new Imaginetime app


Tuesday 9/24:
Participants: Grant, Erik, Anders, Carl, Fred, Tom, Chad, Katie (no show), Jason (doing demos next door), Donna (no show), Bill? (showed up 2:30)

8:40 jason shows up
9:40 carl and fred show up
10:50 begin, intros
11:00 summary of goals of the sprint
- start broad then chunk out work into manageable pieces
- work backwards to find that initial piece and develop timeline
- carl: "trust the process here" (paraphrased)
- goal: roughly 6 week dev cycles, with speculative dates attached
-- jason/fred: 2nd half of october is very important sales period
11:20 process discussion
- everyone has their own goals, who gets to make actual decisions/break ties?
- draw ideas, roughly spec them out, then bet on them
- discussions on how to be agile and change course based on customer feedback.
11:30 review current practice management landscape
- lots of competitors for various areas of PM, few do it all
- existing dominant players: thompson reuters and cch - old and expensive, but have complete solutions. far from majority market share though.
- discussion (fred vs. jason) on if IT should target law firms and other industries, etc. jason says focus on accountants first.
- clio - good example to follow from the law side
11:40 coffee break
11:55 putting the parts of application on the board
- great mixed use development analogy by erik
- trying to segment app into major parts and drawing on the board
- so far: dms, file sharing, crm, e-sig, client worksflows, time tracking, firm workflows (due date), contracts, billing, reporting, payments, integrations, insights, self service
- discussions about marketing, and if/how the firms marketing to clients is integrated into the app
- also about reporting vs insights
- all up on the board on sticky notes
- green dots: these will generate money for imagine time (see pic)
- pink dots: these could be standalone
- they do NOT like self service sign ups, surprisingly
- discussions about migrations, very important to them, mentioned file migrations (DMS) again
 - 12:40 still going with board discussions
 - fred keeps referencing his chart, mentions firm workflows being important
 - chad says we should work back from client portal, in order firm workflow -> time tracking -> billing -> payments
 - carl & fred: what is sellable by january? by next tax season?
 - carl: why not do payments FIRST without billing (they'd track with the old app), and work backwards from there?
 -- store invoices in the portal
 -- downside: would only benefit old version users though
 - leaning towards workflow first, then time tracking, then billing, then payments
 1:15 lunch @ luna
 2:15 back from lunch
 - sentiment analysis? worthwhile to integrate into app? could help firms keep business
- anders: how can we not only build features but also be innovative?
-- carl: we can think of legacy IT as a competitor; need to do it not just the same but better
- what can we do better than people? what makes it sticky?
2:30 migration discussions
- latest craze for "what should come first"
- jason pushing for it hard, carl "doesn't disagree"
- lots of discussion of how valuable vs how hard
2:40 discussing how to score major items
- in categories: adjacency, revenue, technical difficulty, innovation
- developing column and rows system
- fred making up his own ranking system
- jason only cares about what he can sell before tax season
- jason: why can't we host their firm website for them?
- fred disagrees over what CRM means. really wants birthdays in the calendar.
- carl: "minimum viable for accounting specific use cases" is goal
- carl: wants next release on oct 15
3:00 beginning to actually grade the items, see attached pic
- trying to score things is a nightmare
-- lots of disagreement, hard for them to evaluate things individually
-- fred is incredibly frustrating to try to talk to
- integrations are getting a lot of high scores
-- carls know more about how difficult they will be than I do, apparently
- migrations: most important are files, and then existing clients
- reporting: visualization will be important (unknown)
- erik: "interesting if we made IT more client-centric than others"
- CRM: includes birthdays, historical revenue, messaging, prospecting info??
- DMS: includes versioning, blocking, tags, OCR tagging
- messaging: what does it mean?
-- text messaging for notifications (esp. nudges)
-- email aggregation, all client comms via email loaded in, create task from email
- calendly integration?
4:00 finally done with grading of the list items
4:10 nope, they decided to go back and regrade some
- they decided to remove time tracking entirely, since "it will never get built without billing"
- also removed value billing
- dude behind me keeps trying to pull me into 1v1 convos with his own ideas
-- "what if we linked time tracking to their apple watch though?" - no
4:20 finally have final grading (see pic)
- firm workflows is the current highest with 9, followed by sms messaging at 8, then CRM with 6 and time and billing at 5
- everyone still ignoring the rankings and push their own thing; jason with migrations and carl with billing. 
- fred is flabbergasted that we think we can build due date functionality by january and then time and billing by may. thinks we "will lose the whole business to a mistake." 
- jason still wants migrations. why didn't he say anything about migrations before now?
- he also wants a gmail plugin - first we've heard about it
- oct 15 date keeps popping up as important; date of tax extension deadline I think.
- carl wants to know if we can double the speed ("two 6 week sprints at the same time") by hiring extra people. answer: sure, for more $$
- discussion over what CRM is. in this case, they want it to only be customer contact info.
- focus tomorrow: figure out what we need to do to complete the existing buckets and then dig deeper into the new ones.
- carls wants "full solution map" - whatever we think add 6 months to it because he will 100% try to hold us to anything we say right now.
- first thing tomorrow, quick dive through competing tools


Wednesday 9/25:
Participants: Grant, Erik, Anders, Carl, Fred, Tom, Chad, Katie, Jason (doing demos next door, in and out)

10:10 getting started drawing high level items on the board
- introducing time limits
- agenda discussion
-- interactive, 45 mins on features within each high level item
-- lightning demos of existing competitors/examples
-- lunch
-- private note taking
-- breadboarding for high level items (HLI)
-- crazy 8s based on ideas
-- solution sketches for those HLIs
10:15 lightning round
- begin timer ideas for each HLI, 3 min each
11:20 bathroom break
11:30 reviewing HLI sticky ideas
11:35 going in and grouping the massive numbers of yellow stickies for each HLI into broad categories
11:55 lightning demos
- discussions (anders led) about how the client user communications should be the focus
-- initially mostly in agreement
-- carl starts pushing back saying reporting is now the most important thing that will drive adoption
-- also that we won't release time tracking without billing, and neither without reports too
- "plumbing" parts (time and billing) vs client communications parts (crm, sms)
- carl: "our first target is our existing customers. they want a replacement for the existing imaginetime desktop product."
-- this is a big sticking point for him, but I feel like it could be extremely limiting
1:10 lunch (copa)
2:15 back from lunch
2:20 a few more demos
- jason demoing imagine time
- getting actual demo experience he uses for clinets
-- interesting strategy: build up their pain around their current version first
- jetpack workflow
-- this is THE competitor for the task/workflow stuff
-- timers: concurrent, stay at bottom of screen, but feels unorganized
-- ui is busy
- asana
-- similar feature set but drastically more simpler layout and UI
-- fred LIKES the ui!
--- concerned about permissions and audit trail though
- back to jason for more IT portal demo
-- discussion on visual design and how it should be deferred in favor of the important working bits of the UX (anders)
-- his wants (not really the point of the demos but...)
--- more granular permissions
--- gmail plugin similar to outlook version
--- also wants right clicking
--- file renaming, DMS stuff
--- more actions from the list pages
3:45 demoing existing imaginetime desktop
- focus on time, billing, then reporting
- time tracking:
-- timer tab
-- associated with rates and charges (work codes and billed or not toos)
-- print out timesheet for the day
-- also after the fact time entry
- reports
-- tons of options.
-- unbilled time and expenses
-- costs vs billed
-- WIP (work in progress)
-- invoices by date
-- billing history
-- staff realization
--- these get intense
--- other programs can't do this though
-- tons of reports types, but very difficult to make custom ones
- carl wants us to be an ERP system (enterprise resource planning) for accountants
- carl reiterates "current imaginetime clients first"
- my thoughts: all these numbers and reports are great! I agree with carl! but actually getting to the point where we have these numbers is very long and difficult.
- carl doesnt think invoices themselves are important.
-- fred disagrees, "I don't think you get it."
--- its getting contentious
- erik: why not do (basic) reports before we do billing/invoices?
-- fred disagrees; carl, chad, and tom agree
- discussions on how to format invoices
4:45 ending 15 minutes early


Thursday 9/26:
Participants: Grant, Erik, Anders, Carl, Fred, Tom, Chad, Jason (demos next door)

9:05 starting earlier today
- reviewing sprint goals
- erik: i've changed where we want to end up at the end of this slightly
- discussion on goals, the overall project timeline
-- carl: work backwards from May 1, "that's a very firm date for me"
-- carl seems very set on time and billing being the priority, regardless of further discussions
-- what the 6 week chunks mean, why, how much can be accomplished in each, etc
9:30 reviewng HLI stickies on white board
- everyone going around and trying to categorize stickies in themes for each HLI
10:25 major themes from HLI
- going through them and people keep adding brand new, never discussed things
- jason only wants to talk about integrations
-- "every single other DMS has scanner integration"
11:10 finished creating major themes in HLIs; discussions
11:15 begin dots
11:30 big egg ring on the board, moving HLIs into it
- categories: Client Health, Revenue/Profitability, Scale/Efficiency
- not a lot of notes because we're drawing on the board
12:30 others to lunch, erik and grant draw up dependency timeline
1:30 review big timeline
- lots of discussion and controversy
- carl, now: "finishing the portal and bulk file uploads are THE most important thing RIGHT NOW"
-- news to me
- migrations moved to the front of the timeline
- jason: new list of all these changes he NEEDS
- anders on UX vs. design flair
- discussion of payments within the system
-- probably post May 1 launch feature
- e-sig discussions
-- jason wants it to be in the outlook plugin; as few steps as possible
- now carl thinks we should NOT FORGET GUYS to also focus on file sharing parts
3:00 chad and katie leave
3:05 finally trying to spec out a rough timeline and release schedule
- some discussions on workflows with tom
- general ideas:
-- next (start mid october): additional file sharing and migration stuff to "finish" portal
-- then (december): begin designing workflows (anders) schema-ing time & billing (grant) and misc bugs and other todos
-- jan 2020: begin to build out workflows, design out time & billing
- discussions on getting feedback from the board of advisors and having them review designs, esp. workflows and time & billing
- carl: "bigger project than we all thought"
- carl: what if we ignore time and billing for the time being (really Ander's idea)
-- "I had not thought about that yet" - except we've been saying that all along
