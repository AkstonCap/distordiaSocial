# Distordia Social - State Machine Diagrams

State machine diagrams for all core flows in the Distordia Social module, aligned with the [Nexus API](../Nexus%20API%20docs/PROTOCOL.MD) documentation.

Related economics documentation:
- [Economic Incentive State Machines](./economic-incentives-state-machines.md)
- [Economic Incentive Improvements](./economic-incentives-improvements.md)

---

## 1. Application Navigation

Top-level tab navigation across the three main views.

```mermaid
stateDiagram-v2
    [*] --> NewsFeed : App loads (default tab)

    NewsFeed --> NamespaceFeed : SWITCH_TAB("NamespaceFeed")
    NewsFeed --> Profile : SWITCH_TAB("Profile")

    NamespaceFeed --> NewsFeed : SWITCH_TAB("NewsFeed")
    NamespaceFeed --> Profile : SWITCH_TAB("Profile")

    Profile --> NewsFeed : SWITCH_TAB("NewsFeed")
    Profile --> NamespaceFeed : SWITCH_TAB("NamespaceFeed")

    state NewsFeed {
        [*] --> FeedLoading
        FeedLoading --> FeedLoaded
        FeedLoading --> FeedError
        FeedLoaded --> FeedLoading : Refresh
    }

    state NamespaceFeed {
        [*] --> NSLoading
        NSLoading --> NSLoaded
        NSLoading --> NSError
        NSLoaded --> NSLoading : Namespace changed / Refresh
    }

    state Profile {
        [*] --> ProfileLoading
        ProfileLoading --> ProfileLoaded
        ProfileLoading --> ProfileError
        ProfileLoaded --> ProfileLoading : Refresh
    }

    note right of NewsFeed
        UI state persisted to session storage.
        Tab state dispatched via Redux SWITCH_TAB action.
    end note
```

---

## 2. Social Feed Loading

How posts are fetched from the Nexus blockchain using the Register API. All queries are unauthenticated reads via `register/list` and `register/get`.

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> FetchingPosts : Component mounts / Refresh clicked

    state FetchingPosts {
        [*] --> QueryBlockchain
        QueryBlockchain --> FetchQuotedPosts
        FetchQuotedPosts --> FetchVerification
        FetchVerification --> [*]
    }

    FetchingPosts --> Loaded : All data resolved
    FetchingPosts --> Error : API call failed

    Error --> FetchingPosts : Retry / Refresh

    Loaded --> Filtering : User applies filter
    Filtering --> Loaded : Filter resolved

    Loaded --> FetchingPosts : Refresh clicked

    state QueryBlockchain {
        [*] --> ParallelFetch
        state ParallelFetch {
            [*] --> FetchPosts
            [*] --> FetchQuotes
            FetchPosts --> MergePosts
            FetchQuotes --> MergePosts
            MergePosts --> SortByCreated
        }
    }

    state FetchQuotedPosts {
        [*] --> CollectAddresses
        CollectAddresses --> DeduplicateAddresses
        DeduplicateAddresses --> ParallelAssetGet
        ParallelAssetGet --> CacheResults
    }

    state FetchVerification {
        [*] --> CheckCache
        CheckCache --> ReturnCached : Cache valid (< 5 min)
        CheckCache --> FetchTiers : Cache expired
        FetchTiers --> UpdateCache
        UpdateCache --> ReturnCached
    }

    note right of QueryBlockchain
        register/list/assets:asset
        where="results.distordia-type=distordia-post
          AND results.distordia-status=official"

        Also fetches distordia-quote type in parallel.
    end note

    note right of FetchQuotedPosts
        register/get/assets:asset
        address=<quoted-or-reply-address>

        Parallel batch for all unique
        quote/reply-to addresses.
    end note
```

---

## 3. Post Composition & Publishing

The full lifecycle of composing and publishing a post as an on-chain asset via `assets/create/asset` (JSON format).

```mermaid
stateDiagram-v2
    [*] --> Empty

    Empty --> Composing : User starts typing

    state Composing {
        [*] --> Editing
        Editing --> Editing : Text input (charCount updates)
        Editing --> WithContext : SET_REPLY_TO or SET_QUOTE
        WithContext --> Editing : CLEAR_COMPOSE_CONTEXT
        Editing --> WithCW : Toggle CW field
        WithCW --> Editing : Toggle CW off
        WithCW --> WithContext : SET_REPLY_TO or SET_QUOTE
    }

    Composing --> Validating : User clicks "Post to Nexus"

    state Validating {
        [*] --> CheckEmpty
        CheckEmpty --> Rejected : text.trim() is empty
        CheckEmpty --> CheckLength : Has content
        CheckLength --> Rejected : charCount > 512
        CheckLength --> Valid : charCount <= 512
    }

    Rejected --> Composing : Show error, return to editing

    Valid --> Confirming : Show wallet confirmation dialog

    state Confirming {
        [*] --> WaitingForUser
        WaitingForUser --> Confirmed : User accepts (1 NXS fee)
        WaitingForUser --> Cancelled : User declines
    }

    Cancelled --> Composing : Return to editing

    Confirmed --> Publishing

    state Publishing {
        [*] --> BuildJSON
        BuildJSON --> SecureAPICall
        SecureAPICall --> TxBroadcast
    }

    Publishing --> Success : API returns {success, address, txid}
    Publishing --> Failed : API returns error

    Success --> Empty : Reset form, CLEAR_COMPOSE_CONTEXT
    Success --> RefreshFeed : setTimeout(fetchPosts, 2000)

    Failed --> Composing : Show error dialog, keep content

    note right of BuildJSON
        assets/create/asset
        format=JSON
        json=[
          {name:"distordia-type", value:"distordia-post",
           mutable:false, maxlength:16},
          {name:"distordia-status", value:"official",
           mutable:true, maxlength:16},
          {name:"text", value:<user-text>,
           mutable:false, maxlength:512},
          {name:"cw", mutable:false, maxlength:64},
          {name:"reply-to", mutable:false, maxlength:64},
          {name:"quote", mutable:false, maxlength:64},
          {name:"repost", mutable:false, maxlength:64},
          {name:"tags", mutable:false, maxlength:128},
          {name:"lang", value:"en", mutable:false, maxlength:2}
        ]
    end note

    note left of Confirming
        Wallet-level confirmation via
        nexus-module confirm() dialog.
        Costs 1 NXS per asset creation.
    end note
```

---

## 4. On-Chain Post Asset Lifecycle

How a Distordia post exists on the Nexus blockchain as a register, per the Assets API.

```mermaid
stateDiagram-v2
    [*] --> Creating : assets/create/asset (format=JSON)

    Creating --> Pending : Transaction broadcast to network

    Pending --> Confirmed : Block mined with transaction
    Pending --> Failed : Network rejection

    Failed --> [*]

    Confirmed --> Active : distordia-status = "official"

    state Active {
        [*] --> Immutable
        note right of Immutable
            Immutable fields (mutable=false):
            - distordia-type: "distordia-post"
            - text: post content (max 512)
            - cw: content warning (max 64)
            - reply-to: parent post address
            - quote: quoted post address
            - repost: reserved
            - tags: hashtags (max 128)
            - lang: language code
        end note
    }

    Active --> StatusUpdated : assets/update/asset\n(distordia-status field only)

    StatusUpdated --> Active : Status changed

    Active --> Transferring : assets/transfer/asset\n(recipient, expires)

    Transferring --> TransferPending : Awaiting claim

    TransferPending --> Claimed : assets/claim/asset (by recipient)
    TransferPending --> Expired : Transfer expires (default 7 days)

    Expired --> Active : Returns to original owner
    Claimed --> Active : New owner holds the post

    note right of Active
        Readable by anyone via:
        register/get/assets:asset (address=...)
        register/list/assets:asset (where=...)

        No session required for reads.
    end note

    note left of StatusUpdated
        Only mutable field is distordia-status.
        Requires active session + PIN.
        assets/update/asset format=JSON
    end note
```

---

## 5. Verification Tier Resolution

How the verification badge system queries the on-chain registry and resolves tiers for users.

```mermaid
stateDiagram-v2
    [*] --> CheckCache

    CheckCache --> CacheHit : Cache age < 5 min
    CheckCache --> FetchFromChain : Cache expired or empty

    CacheHit --> ResolveTier

    state FetchFromChain {
        [*] --> FetchL3
        FetchL3 --> FetchL2
        FetchL2 --> FetchL1
        FetchL1 --> BuildMap
    }

    state FetchL3 {
        [*] --> QueryL3_1
        QueryL3_1 --> QueryL3_N : More assets exist
        QueryL3_N --> ParseL3 : API returns error (no more)
        QueryL3_1 --> ParseL3 : API returns error (none)
    }

    state FetchL2 {
        [*] --> QueryL2_1
        QueryL2_1 --> QueryL2_N : More assets exist
        QueryL2_N --> ParseL2 : API returns error (no more)
        QueryL2_1 --> ParseL2 : API returns error (none)
    }

    state FetchL1 {
        [*] --> QueryL1_1
        QueryL1_1 --> QueryL1_N : More assets exist
        QueryL1_N --> ParseL1 : API returns error (no more)
        QueryL1_1 --> ParseL1 : API returns error (none)
    }

    BuildMap --> UpdateCache
    UpdateCache --> ResolveTier

    state ResolveTier {
        [*] --> LookupGenesis
        LookupGenesis --> HasL3 : Found in L3 map
        LookupGenesis --> HasL2 : Found in L2 map
        LookupGenesis --> HasL1 : Found in L1 map
        LookupGenesis --> NotVerified : Not found
    }

    HasL3 --> [*] : Return "L3" (100,000+ DIST)
    HasL2 --> [*] : Return "L2" (10,000+ DIST)
    HasL1 --> [*] : Return "L1" (1,000+ DIST)
    NotVerified --> [*] : Return null

    note right of FetchL3
        register/get/asset
        name="distordia:L3-verified-{index}"

        Iterates index 1..N until API
        returns error (no more assets).
        Higher tiers fetched first for
        precedence.
    end note

    note left of ResolveTier
        Tier thresholds (DIST tokens):
        L1: 1,000
        L2: 10,000
        L3: 100,000

        Higher tier takes precedence
        when user qualifies for multiple.
    end note
```

---

## 6. Post Interaction Flow

User interactions with existing posts: Reply, Quote, and View On-Chain.

```mermaid
stateDiagram-v2
    [*] --> ViewingFeed

    state ViewingFeed {
        [*] --> BrowsingPosts
        BrowsingPosts --> PostSelected : User interacts with a post
    }

    PostSelected --> ReplyFlow : Click "Reply"
    PostSelected --> QuoteFlow : Click "Quote"
    PostSelected --> ViewOnChain : Click "On-chain"

    state ReplyFlow {
        [*] --> DispatchReplyTo
        DispatchReplyTo --> ScrollToComposer
        ScrollToComposer --> ComposerShowsContext
    }

    state QuoteFlow {
        [*] --> DispatchQuote
        DispatchQuote --> ScrollToComposer2
        ScrollToComposer2 --> ComposerShowsQuote
    }

    ReplyFlow --> ComposingReply : SET_REPLY_TO dispatched
    QuoteFlow --> ComposingQuote : SET_QUOTE dispatched

    state ComposingReply {
        [*] --> ReplyContextVisible
        ReplyContextVisible --> ClearContext : Click "Clear"
        ReplyContextVisible --> WriteReply : User types reply
        WriteReply --> PublishReply : Post to Nexus
    }

    state ComposingQuote {
        [*] --> QuoteContextVisible
        QuoteContextVisible --> ClearContext2 : Click "Clear"
        QuoteContextVisible --> WriteQuote : User types quote
        WriteQuote --> PublishQuote : Post to Nexus
    }

    PublishReply --> ViewingFeed : Post created (reply-to field set)
    PublishQuote --> ViewingFeed : Post created (quote field set)
    ClearContext --> ViewingFeed : CLEAR_COMPOSE_CONTEXT
    ClearContext2 --> ViewingFeed : CLEAR_COMPOSE_CONTEXT

    state ViewOnChain {
        [*] --> OpenModal
        OpenModal --> FetchAsset
        FetchAsset --> ShowJSON : register/get/assets:asset
        FetchAsset --> ShowError : API error
    }

    ShowJSON --> ViewingFeed : Close modal
    ShowError --> ViewingFeed : Close modal

    note right of PublishReply
        Post asset created with:
        reply-to = parent post address
        quote = ""
    end note

    note right of PublishQuote
        Post asset created with:
        reply-to = ""
        quote = quoted post address
    end note
```

---

## 7. Content Warning Display

The content warning reveal/hide micro-state for individual posts.

```mermaid
stateDiagram-v2
    [*] --> CheckCW

    CheckCW --> NoCW : post.cw is empty
    CheckCW --> Hidden : post.cw has content

    NoCW --> ShowText : Render post text directly

    state Hidden {
        [*] --> DisplayWarning
        note right of DisplayWarning
            Shows: "CW: {warning text} (click to reveal)"
            Post text is hidden behind the warning.
        end note
    }

    Hidden --> Revealed : User clicks content warning

    state Revealed {
        [*] --> ShowText2
        note right of ShowText2
            Full post text now visible.
            CW state is per-component instance,
            not persisted (resets on re-render).
        end note
    }

    ShowText --> [*]
    ShowText2 --> [*]
```

---

## 8. Redux State Management

How Redux state transitions map to user actions and API calls.

```mermaid
stateDiagram-v2
    state ReduxStore {
        state UIState {
            [*] --> DefaultUI

            state DefaultUI {
                activeTab = NewsFeed
                inputValue = ""
                replyTo = null
                quote = null
            }
        }

        state SettingsState {
            [*] --> DefaultSettings

            state DefaultSettings {
                extNamespace = "distordia"
                myNamespace = ""
            }
        }
    }

    state Actions {
        SWITCH_TAB --> UIState : Update activeTab
        UPDATE_INPUT --> UIState : Update inputValue
        SET_REPLY_TO --> UIState : Set replyTo post
        SET_QUOTE --> UIState : Set quote post
        CLEAR_COMPOSE_CONTEXT --> UIState : Reset replyTo & quote to null
        SWITCH_EXT_NAMESPACE --> SettingsState : Update extNamespace
        SWITCH_MY_NAMESPACE --> SettingsState : Update myNamespace
    }

    state Persistence {
        UIState --> SessionStorage : stateMiddleware
        SettingsState --> DiskStorage : storageMiddleware
    }

    note right of SessionStorage
        UI state persisted to session storage
        via nexus-module stateMiddleware.
        Lost when session ends.
    end note

    note right of DiskStorage
        Settings persisted to disk
        via nexus-module storageMiddleware.
        Survives app restarts.
    end note
```

---

## 9. Nexus Session & Authentication Context

How the Nexus Wallet session underpins authenticated operations. The Distordia module runs inside the wallet and relies on wallet-managed sessions.

```mermaid
stateDiagram-v2
    [*] --> NoSession : Wallet not logged in

    NoSession --> Creating : sessions/create/local\n(username, password, pin)

    Creating --> ActiveSession : Returns {genesis, session}
    Creating --> CreateFailed : Invalid credentials

    CreateFailed --> NoSession

    state ActiveSession {
        [*] --> Locked

        Locked --> Unlocked : sessions/unlock/local\n(pin, transactions=true)
        Unlocked --> Locked : sessions/lock/local

        state Locked {
            [*] --> ReadOnly
            note right of ReadOnly
                Can perform read operations:
                - register/list (browse posts)
                - register/get (view assets)
                - Browse feed, search, filter

                Cannot create transactions
                without providing PIN per call.
            end note
        }

        state Unlocked {
            [*] --> FullAccess
            note right of FullAccess
                Can perform all operations:
                - assets/create/asset (post)
                - assets/update/asset (status)
                - assets/transfer/asset
                - All read operations

                PIN cached in encrypted memory.
            end note
        }
    }

    ActiveSession --> Terminated : sessions/terminate/local
    ActiveSession --> Saved : sessions/save/local

    Terminated --> NoSession
    Saved --> NoSession : Can be resumed later

    NoSession --> Resuming : sessions/load/local\n(username/genesis, pin)
    Resuming --> ActiveSession : Session restored
    Resuming --> NoSession : Load failed

    note right of ActiveSession
        Distordia uses secureApiCall()
        from nexus-module for writes.
        This handles PIN prompting
        automatically via the wallet UI.

        Read operations use apiCall()
        which requires no authentication.
    end note
```

---

## 10. Namespace Feed Flow

The namespace-specific feed that filters posts by a given Nexus namespace.

```mermaid
stateDiagram-v2
    [*] --> DefaultNamespace : extNamespace = "distordia"

    DefaultNamespace --> Loading : Component mounts

    state Loading {
        [*] --> FetchAllPosts
        FetchAllPosts --> FilterByNamespace
        FilterByNamespace --> FetchVerification
        FetchVerification --> [*]
    }

    Loading --> Displaying : Posts loaded and filtered
    Loading --> Error : API failure

    Error --> Loading : Retry

    Displaying --> SearchInput : User enters namespace in search

    SearchInput --> NamespaceChanged : SWITCH_EXT_NAMESPACE

    NamespaceChanged --> Loading : Re-fetch with new namespace filter

    Displaying --> ViewAsset : Click "On-chain" on a post

    state ViewAsset {
        [*] --> OpenModal2
        OpenModal2 --> FetchAssetData
        FetchAssetData --> ShowJSON2 : register/get/assets:asset
        FetchAssetData --> ShowError2 : API error
    }

    ShowJSON2 --> Displaying : Close modal
    ShowError2 --> Displaying : Close modal

    note right of FilterByNamespace
        Posts filtered client-side by matching
        Creator's namespace field against
        the extNamespace value.

        Namespace resolution uses the
        Nexus TNS (names/get/namespace).
    end note
```

---

## 11. Profile View Flow

How the user's profile and owned posts are loaded via the Assets API.

```mermaid
stateDiagram-v2
    [*] --> LoadingProfile

    state LoadingProfile {
        [*] --> ParallelFetch2
        state ParallelFetch2 {
            [*] --> FetchMyAssets
            [*] --> FetchVerified
            FetchMyAssets --> [*]
            FetchVerified --> [*]
        }
        ParallelFetch2 --> FilterPosts
        FilterPosts --> ExtractProfileInfo
        ExtractProfileInfo --> [*]
    }

    LoadingProfile --> ProfileReady : Data loaded
    LoadingProfile --> ProfileError : API failure

    ProfileError --> LoadingProfile : Retry

    state ProfileReady {
        [*] --> DisplayProfile

        state DisplayProfile {
            [*] --> ShowProfileCard
            ShowProfileCard --> ShowMyPosts

            state ShowProfileCard {
                note right of ShowProfileCard
                    Displays:
                    - Namespace (@name or "No Namespace")
                    - Genesis ID (full hash)
                    - Post count
                    - Verification badge (if any)
                end note
            }
        }
    }

    ProfileReady --> ViewPostOnChain : Click post or "On-chain"

    state ViewPostOnChain {
        [*] --> FetchPost
        FetchPost --> DisplayJSON : register/get/assets:asset
        FetchPost --> DisplayError : API error
    }

    DisplayJSON --> ProfileReady : Close modal
    DisplayError --> ProfileReady : Close modal

    note right of FetchMyAssets
        assets/list/asset
        (authenticated, returns only
         assets owned by logged-in profile)

        Results filtered client-side for
        distordia-type = "distordia-post"
    end note

    note left of ExtractProfileInfo
        Profile info derived from first post:
        - Creator's namespace
        - owner (genesis hash)
        - Post count

        If namespace differs from stored
        myNamespace, dispatches
        SWITCH_MY_NAMESPACE.
    end note
```

---

## API Endpoint Reference

Summary of all Nexus API endpoints used by Distordia Social, mapped to the flows above.

| Flow | API Endpoint | Verb | Auth Required | Purpose |
|------|-------------|------|:---:|---------|
| Feed Loading | `register/list/assets:asset` | GET | No | Fetch all posts with `where` filter |
| Quoted Posts | `register/get/assets:asset` | GET | No | Fetch individual post by address |
| View On-Chain | `register/get/assets:asset` | GET | No | Display raw asset JSON |
| Post Creation | `assets/create/asset` | POST | Yes (PIN) | Create post as JSON-format asset |
| Status Update | `assets/update/asset` | POST | Yes (PIN) | Update mutable `distordia-status` |
| Profile Posts | `assets/list/asset` | GET | Yes (session) | List assets owned by logged-in user |
| Verification | `register/get/asset` | GET | No | Read verification registry assets |
| Session | `sessions/create/local` | POST | N/A | Create login session (wallet-managed) |
| Unlock | `sessions/unlock/local` | POST | Yes (PIN) | Unlock session for transactions |
