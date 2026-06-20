<template>
  <div>
    <div class="wiki-container">
      <lobby-logo />
      <!-- 游戏简介 -->
      <div class="wiki-section">
        <div class="section-header" @click="toggleSection('intro')">
          <span class="section-title">游戏简介</span>
          <span class="expand-icon" :class="{ expanded: expandedSections.intro }">›</span>
        </div>

        <div v-if="expandedSections.intro" class="section-body">
          <span class="section-content">
            阿瓦隆（The Resistance:
            Avalon）是一款多人社交推理游戏，玩家分为善良方和邪恶方两个阵营。善良方需要通过完成任务来获胜，而邪恶方则试图破坏任务。游戏的核心在于信息的不对称和身份的隐藏，需要玩家通过观察、推理和交流来找出队友或敌人。
          </span>
        </div>
      </div>

      <!-- 阵营介绍与默认角色 -->
      <div class="wiki-section">
        <div class="section-header" @click="toggleSection('camps')">
          <span class="section-title">阵营介绍</span>
          <span class="expand-icon" :class="{ expanded: expandedSections.camps }">›</span>
        </div>

        <div v-if="expandedSections.camps" class="section-body">
          <!-- 阵营标识展示 -->
          <div class="camp-badges">
            <div class="camp-badge-item">
              <img class="camp-badge-icon" :src="getImage('core/blue_team_no_background.webp')" mode="aspectFit" />
              <span class="camp-badge-label">善良方（蓝方）</span>
              <span class="condition-item">胜利条件：3个任务成功且梅林或恋人没有被刺杀</span>
            </div>
            <div class="camp-badge-item">
              <img class="camp-badge-icon" :src="getImage('core/red_team_no_background.webp')" mode="aspectFit" />
              <span class="camp-badge-label">邪恶方（红方）</span>
              <span class="condition-item">胜利条件：3个任务失败 / 连续 5 次流局 / 刺杀梅林或恋人</span>
            </div>
          </div>

          <!-- 善良方角色 -->

          <!-- 梅林 -->

          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('merlin')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">梅林 (Merlin)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                知道所有邪恶方身份（莫德雷德除外），需要引导蓝方获胜，同时避免过于准确地指控红方而被识破。
              </span>
            </div>
          </div>

          <!-- 派西维尔 -->

          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('percival')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">派西维尔 (Percival)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                能够看到梅林和莫甘娜，但不知道谁是真正的梅林，需要识别真假并保护梅林不被红方发现。
              </span>
            </div>
          </div>
          <!-- 忠臣 -->

          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('servant')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">忠臣 (Servant)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description"> 普通蓝方角色，不知道任何特殊信息，需要通过观察和推理来辨别善恶。 </span>
            </div>
          </div>

          <!-- 邪恶方角色 -->

          <!-- 莫甘娜 -->
          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('morgana')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">莫甘娜 (Morgana)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                能够被派西维尔看到，需要模仿梅林的行为以误导派西维尔，制造任务失败并观察谁可能是梅林 / 恋人。
              </span>
            </div>
          </div>

          <!-- 爪牙 -->
          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('minion')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">爪牙 (Minion)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                普通红方角色，知道队友身份。需要制造混乱和怀疑，制造任务失败并观察谁可能是梅林 / 恋人。
              </span>
            </div>
          </div>

          <!-- 莫德雷德 -->
          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('mordred')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">莫德雷德 (Mordred)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                对梅林隐藏身份，可以利用身份优势大胆发言，协助队友制造混乱并观察谁可能是梅林 / 恋人。
              </span>
            </div>
          </div>

          <!-- 奥伯伦 -->
          <div class="role-detail">
            <img class="role-avatar" :src="getRoleImage('oberon')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">奥伯伦 (Oberon)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                不知道任何人的身份，也不被红方识别，但是能够被梅林看到，需要通过观察找到队友并配合破坏任务。
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 游戏流程 -->
      <div class="wiki-section">
        <div class="section-header" @click="toggleSection('flow')">
          <span class="section-title">游戏流程</span>
          <span class="expand-icon" :class="{ expanded: expandedSections.flow }">›</span>
        </div>

        <div v-if="expandedSections.flow" class="section-body">
          <div class="flow-step">
            <span class="step-number">1. 身份确认</span>
            <span class="step-content"
              >游戏开始时，每位玩家会收到自己的角色和阵营信息。根据角色不同，可能会知道其他玩家的身份。</span
            >

            <!-- 角色配置表格 -->
            <div class="role-config-table">
              <div class="table-header">
                <span class="table-cell player-count">玩家数</span>
                <span class="table-cell camp-cell">善良方</span>
                <span class="table-cell camp-cell">邪恶方</span>
              </div>

              <div class="table-row">
                <span class="table-cell player-count">5人</span>
                <span class="table-cell camp-cell">梅林, 派西维尔, 忠臣</span>
                <span class="table-cell camp-cell">莫甘娜, 爪牙</span>
              </div>

              <div class="table-row">
                <span class="table-cell player-count">6人</span>
                <span class="table-cell camp-cell">梅林, 派西维尔, 忠臣×2</span>
                <span class="table-cell camp-cell">莫甘娜, 爪牙</span>
              </div>

              <div class="table-row">
                <span class="table-cell player-count">7人</span>
                <span class="table-cell camp-cell">梅林, 派西维尔, 忠臣×2</span>
                <span class="table-cell camp-cell">莫甘娜, 奥伯伦, 爪牙</span>
              </div>

              <div class="table-row">
                <span class="table-cell player-count">8人</span>
                <span class="table-cell camp-cell">梅林, 派西维尔, 忠臣×3</span>
                <span class="table-cell camp-cell">莫德雷德, 莫甘娜, 爪牙</span>
              </div>

              <div class="table-row">
                <span class="table-cell player-count">9人</span>
                <span class="table-cell camp-cell">梅林, 派西维尔, 特里斯坦, 伊索德, 忠臣×2</span>
                <span class="table-cell camp-cell">莫德雷德, 莫甘娜, 爪牙</span>
              </div>

              <div class="table-row">
                <span class="table-cell player-count">10人</span>
                <span class="table-cell camp-cell">梅林, 派西维尔, 特里斯坦, 伊索德, 忠臣×2</span>
                <span class="table-cell camp-cell">莫德雷德, 莫甘娜, 爪牙, 奥伯伦</span>
              </div>
            </div>

            <span class="table-note">注：以上为推荐配置，可根据实际情况调整角色组合</span>
          </div>

          <div class="flow-step">
            <span class="step-number">2. 选择队伍</span>
            <span class="step-content"
              >由当前领袖选择若干名玩家组成任务队伍。需要选择的人数根据任务和玩家总数决定。</span
            >

            <!-- 队长标识展示 -->
            <div class="leader-badge">
              <img class="leader-crown-icon" :src="getImage('core/crown.webp')" mode="aspectFit" />
              <span class="leader-badge-label">当前队长（领袖）标识</span>
            </div>
          </div>

          <div class="flow-step">
            <span class="step-number">3. 投票派遣</span>
            <span class="step-content"
              >所有玩家对提议的队伍进行投票，赞成或反对。如果多数赞成则派遣该队伍，否则进入下一轮选择。连续5次投票失败则邪恶方直接获胜。</span
            >
          </div>

          <div class="flow-step">
            <span class="step-number">4. 执行任务</span>
            <span class="step-content"
              >被派遣的玩家秘密选择任务成功或失败。善良方只能选择成功，邪恶方可以选择成功或失败。如果有邪恶方投了失败，该任务就会失败。</span
            >
            <div class="mission-table">
              <div class="table-header">
                <span class="table-cell">玩家数</span>
                <span class="table-cell">任务1</span>
                <span class="table-cell">任务2</span>
                <span class="table-cell">任务3</span>
                <span class="table-cell">任务4</span>
                <span class="table-cell">任务5</span>
              </div>
              <div class="table-row">
                <span class="table-cell">5-6人</span>
                <span class="table-cell">2</span>
                <span class="table-cell">3</span>
                <span class="table-cell">2</span>
                <span class="table-cell">3</span>
                <span class="table-cell">3</span>
              </div>
              <div class="table-row">
                <span class="table-cell">7人</span>
                <span class="table-cell">2</span>
                <span class="table-cell">3</span>
                <span class="table-cell">3</span>
                <span class="table-cell">4*</span>
                <span class="table-cell">4</span>
              </div>
              <div class="table-row">
                <span class="table-cell">8-10人</span>
                <span class="table-cell">3</span>
                <span class="table-cell">4</span>
                <span class="table-cell">4</span>
                <span class="table-cell">5*</span>
                <span class="table-cell">5</span>
              </div>
            </div>
            <span class="table-note">* 标记的任务需要2张失败票才算失败</span>
          </div>

          <div class="flow-step">
            <span class="step-number">5. 公布结果</span>
            <span class="step-content"
              >公布任务结果（成功或失败），以及失败票数。游戏需要完成5个任务，善良方需要3个任务成功才能获胜。</span
            >
          </div>

          <div class="flow-step">
            <span class="step-number">6. 刺客阶段</span>
            <span class="step-content"
              >如果善良方完成了3个任务，刺客有一次机会刺杀一名玩家。如果刺中了梅林，邪恶方获胜；否则善良方获胜。</span
            >
          </div>
        </div>
      </div>

      <!-- 扩展角色 -->
      <div class="wiki-section">
        <div class="section-header" @click="toggleSection('expansionRoles')">
          <span class="section-title">扩展角色（未上线）</span>
          <span class="expand-icon" :class="{ expanded: expandedSections.expansionRoles }">›</span>
        </div>

        <div v-if="expandedSections.expansionRoles" class="section-body">
          <!-- 善良兰斯洛特 -->
          <div class="role-detail good">
            <img class="role-avatar" :src="getRoleImage('good_lancelot')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">兰斯洛特 (Lancelot)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                善良方角色，与邪恶兰斯洛特在游戏中可能互换阵营。女皇可以看到两位兰斯洛特但不知道谁是善谁是恶。互换后需要快速调整为邪恶方策略。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 互换前协助善良方完成任务</span>
                <span class="tips-item">• 互换后立即转为破坏任务</span>
                <span class="tips-item">• 注意保护或误导女皇</span>
              </div>
            </div>
          </div>

          <!-- 邪恶兰斯洛特 -->
          <div class="role-detail evil">
            <img class="role-avatar" :src="getRoleImage('evil_lancelot')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">兰斯洛特 (Evil Lancelot)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                邪恶方角色，与善良兰斯洛特在游戏中可能互换阵营。女皇可以看到两位兰斯洛特但不知道谁是善谁是恶。互换后需要快速调整为善良方策略。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 互换前协助邪恶方破坏任务</span>
                <span class="tips-item">• 互换后立即转为支持善良方</span>
                <span class="tips-item">• 利用身份转换制造混乱</span>
              </div>
            </div>
          </div>

          <!-- 女皇 -->
          <div class="role-detail good">
            <img class="role-avatar" :src="getRoleImage('guinevere')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">女皇 (Guinevere)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                看到两位兰斯洛特，但不知道谁是善谁是恶。需要通过行为判断兰斯洛特的阵营，并在互换后及时调整判断。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 密切关注兰斯洛特的投票</span>
                <span class="tips-item">• 留意任务后的行为变化</span>
                <span class="tips-item">• 与梅林配合但不暴露</span>
              </div>
            </div>
          </div>

          <!-- 牧师 -->
          <div class="role-detail good">
            <img class="role-avatar" :src="getRoleImage('cleric')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">牧师 (Cleric)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                知道第一次任务领导者的忠诚情况，必须保持隐藏。这个关键信息可以帮助善良方建立早期信任。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 巧妙利用首领信息</span>
                <span class="tips-item">• 不要过早暴露知识</span>
                <span class="tips-item">• 引导而非直接揭露</span>
              </div>
            </div>
          </div>

          <!-- 特里斯坦 -->
          <div class="role-detail good">
            <img class="role-avatar" :src="getRoleImage('tristan')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">特里斯坦 (Tristan)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                恋人组合之一，知道伊索德的身份。两人必须保持隐藏并互相配合，避免被红方发现并刺杀。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 通过投票暗中支持伊索德</span>
                <span class="tips-item">• 避免过于明显的配合</span>
                <span class="tips-item">• 建立可信的掩护身份</span>
              </div>
            </div>
          </div>

          <!-- 伊索德 -->
          <div class="role-detail good">
            <img class="role-avatar" :src="getRoleImage('isolde')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">伊索德 (Isolde)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                恋人组合之一，知道特里斯坦的身份。两人必须保持隐藏并互相配合，避免被红方发现并刺杀。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 通过投票暗中支持特里斯坦</span>
                <span class="tips-item">• 避免过于明显的配合</span>
                <span class="tips-item">• 建立可信的掩护身份</span>
              </div>
            </div>
          </div>

          <!-- 麻烦友 -->
          <div class="role-detail good">
            <img class="role-avatar" :src="getRoleImage('troublemaker')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">捣蛋鬼 (Troublemaker)</span>
                <span class="role-loyalty good-tag">善良</span>
              </div>
              <span class="role-description">
                善良方角色，被检验忠诚度时但必须撒谎。这个限制让你看起来像邪恶方，但实际上是善良方。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 合理解释自己的"可疑"行为</span>
                <span class="tips-item">• 利用混乱保护其他善良方</span>
                <span class="tips-item">• 适时揭示真实身份</span>
              </div>
            </div>
          </div>

          <!-- 骗子 -->
          <div class="role-detail evil">
            <img class="role-avatar" :src="getRoleImage('trickster')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">骗子 (Trickster)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                当被湖中女神或牧师检查忠诚时会撒谎，将自己伪装成善良方。需要建立可信形象，制造混乱并操控信息流向。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 建立可信的人设</span>
                <span class="tips-item">• 巧妙地在其他角色上播下怀疑的种子</span>
                <span class="tips-item">• 操控投票模式和信息流</span>
              </div>
            </div>
          </div>

          <!-- 女巫 -->
          <div class="role-detail evil">
            <img class="role-avatar" :src="getRoleImage('witch')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">女巫 (Witch)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                可以隐藏一次任务结果并触发随机玩家的忠诚检验。这个能力只能使用一次，需要选择最能制造混乱并保护盟友的时机。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 利用技能让玩家对任务结果产生不确定性</span>
                <span class="tips-item">• 隐藏任务前务必权衡后果</span>
                <span class="tips-item">• 制造不确定性以打乱善良方的计划</span>
              </div>
            </div>
          </div>

          <!-- 揭秘者 -->
          <div class="role-detail evil">
            <img class="role-avatar" :src="getRoleImage('revealer')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">揭秘者 (Revealer)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                在邪恶方失败两次任务后，身份会被所有玩家知晓。需要提前规划策略，在身份暴露后继续制造混乱。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 在失败任务中主动出击以保护盟友</span>
                <span class="tips-item">• 身份暴露后继续操控信息流</span>
                <span class="tips-item">• 提前几步思考策略</span>
              </div>
            </div>
          </div>

          <!-- 疯子 -->
          <div class="role-detail evil">
            <img class="role-avatar" :src="getRoleImage('lunatic')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">疯子 (Lunatic)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                必须在参与的每个任务中投失败票。这个强制行为增加了挑战性，需要在其他方面采用策略来避免立即被发现。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 在讨论中表现得像有选择权</span>
                <span class="tips-item">• 变化行为以避免固定模式</span>
                <span class="tips-item">• 选择引起最大混乱的时机参与任务</span>
              </div>
            </div>
          </div>

          <!-- 莽夫 -->
          <div class="role-detail evil">
            <img class="role-avatar" :src="getRoleImage('brute')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">莽夫 (Brute)</span>
                <span class="role-loyalty evil-tag">邪恶</span>
              </div>
              <span class="role-description">
                在前三个任务中可以自由选择成功或失败，但在第四和第五个任务中只能投成功。需要利用早期灵活性制造混乱，后期建立信任。
              </span>
              <div class="role-tips">
                <span class="tips-title">游戏提示：</span>
                <span class="tips-item">• 利用早期任务的灵活性迷惑对手</span>
                <span class="tips-item">• 在早期任务中保持不可预测性</span>
                <span class="tips-item">• 后期建立足够信任以转移怀疑</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 扩展模式 -->
      <div class="wiki-section">
        <div class="section-header" @click="toggleSection('expansionModes')">
          <span class="section-title">扩展模式（未上线）</span>
          <span class="expand-icon" :class="{ expanded: expandedSections.expansionModes }">›</span>
        </div>

        <div v-if="expandedSections.expansionModes" class="section-body">
          <div class="role-detail">
            <img class="role-avatar" :src="getImage('features/lady_of_lake.webp')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">湖中女神 (Lady of the Lake)</span>
              </div>
              <span class="role-description">
                持有湖中女神的玩家可以查看另一名玩家的忠诚度（善良或邪恶），查看后将湖中女神传递给其他玩家（不能传回上一位持有者）。这是一个强大的信息获取工具，但使用时要谨慎，因为暴露信息可能会引起邪恶方的注意。
              </span>
            </div>
          </div>

          <div class="role-detail">
            <img class="role-avatar" :src="getImage('features/excalibur.webp')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">圣剑 (Excalibur)</span>
              </div>
              <span class="role-description">
                持有圣剑的玩家可以使用圣剑强制某个任务成功，无论队伍中是否有邪恶方投了失败票。圣剑只能使用一次，使用后会被回收。这是善良方的关键道具，需要在最关键的时刻使用。
              </span>
            </div>
          </div>

          <div class="role-detail">
            <img class="role-avatar" :src="getImage('features/lady_of_sea.webp')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">海之女神 (Lady of the Sea)</span>
              </div>
              <span class="role-description">
                与湖中女神类似，但海之女神允许持有者查看玩家的具体角色信息，而不仅仅是忠诚度。这提供了更详细的信息，但也意味着更大的责任和风险。
              </span>
            </div>
          </div>

          <div class="role-detail">
            <img class="role-avatar" :src="getImage('features/plot_cards.webp')" mode="aspectFit" />
            <div class="role-content">
              <div class="role-header">
                <span class="role-title">剧情卡 (Plot Cards)</span>
              </div>
              <span class="role-description">
                剧情卡是一系列特殊事件卡牌，可以在游戏中触发各种效果，如额外的投票权、强制查看他人身份、更换队伍成员等。每张剧情卡都有独特的效果，为游戏增加了更多变数和策略性。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getRoleImage, getImage } from '~/utils/roleImages';
import LobbyLogo from '~/components/LobbyLogo.vue';
// 折叠面板状态管理
const expandedSections = ref<Record<string, boolean>>({
  intro: true, // 游戏简介默认展开
  camps: false,
  flow: false,
  expansionRoles: false,
  expansionModes: false,
});

// 切换section展开/收起
const toggleSection = (key: string) => {
  expandedSections.value[key] = !expandedSections.value[key];
};
</script>

<style scoped lang="scss">
.wiki-page {
  box-sizing: border-box;

  // 棋盘背景
  // &::before {
  //   content: '';
  //   position: fixed;
  //   top: 50%;
  //   left: 50%;
  //   transform: translate(-50%, -50%);
  //   width: 300px;
  //   height: 300px;
  //   background-image: url('https://storage.yandexcloud.net/avalon-game/images/core/board.webp');
  //   background-size: 100%;
  //   background-position: center;
  //   background-repeat: no-repeat;
  //   opacity: 0.08;
  //   z-index: 0;
  //   pointer-events: none;
  // }
}

.wiki-container {
  padding: $spacing-header $spacing-lg 0;
  position: relative;
}

.wiki-section {
  margin-bottom: $spacing-md;
  overflow: hidden;
}

.wiki-section:first-of-type {
  margin-top: $spacing-xl;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md 0;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  flex: 1;
}

.expand-icon {
  font-size: $font-xxl;
  color: $text-secondary;
  margin-left: $spacing-md;
  transition: transform $transition-normal;
  display: inline-block;

  &.expanded {
    transform: rotate(90deg);
  }
}

.section-body {
  padding: $spacing-lg 0;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-content {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.8;
  display: block;
}

// 阵营标识展示
.camp-badges {
  display: flex;
  justify-content: space-around;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  padding: $spacing-lg 0;
}

.camp-badge-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
}

.camp-badge-icon {
  width: 50px;
  height: 50px;
}

.camp-badge-label {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  text-align: center;
}

// 队长标识展示
.leader-badge {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-top: $spacing-md;
  padding: $spacing-md;
}

.leader-crown-icon {
  width: 30px;
  height: 30px;
  filter: drop-shadow(0 1px 4px rgba(255, 215, 0, 0.3));
}

.leader-badge-label {
  font-size: $font-md;
  color: $text-secondary;
  flex: 1;
}

.role-multi-avatar {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

// 角色组样式
.role-group {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  border-radius: $radius-medium;
}

.group-title {
  font-size: $font-lg;
  font-weight: bold;
  display: block;
  margin-bottom: $spacing-md;
  color: $text-primary;
}

.role-item {
  margin-bottom: $spacing-sm;
  padding-left: $spacing-md;
}

.role-name {
  font-size: $font-lg;
  font-weight: 500;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-xs;
}

.role-desc {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.6;
  display: block;
  padding-left: $spacing-md;
}

// 流程步骤样式
.flow-step {
  margin-bottom: $spacing-lg;
}

.step-number {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-xs;
}

.step-content {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.8;
  display: block;
}

.condition-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-sm;
}

.condition-item {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.8;
  display: block;
}

// 角色配置表格样式
.role-config-table {
  margin: $spacing-md 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-small;
  overflow: hidden;

  .table-header,
  .table-row {
    display: flex;
    align-items: stretch;
  }

  .table-header {
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: bold;
  }

  .table-row {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .table-cell {
    padding: $spacing-sm;
    font-size: $font-sm;
    color: $text-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.5;

    &.player-count {
      flex: 0 0 40px;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }

    &.camp-cell {
      flex: 2;
      padding: $spacing-xs $spacing-sm;
    }

    &:not(.player-count):not(.camp-cell) {
      flex: 1;
    }
  }
}

// 任务表格样式
.mission-table {
  margin: $spacing-md 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-small;
  overflow: hidden;
}

.table-header,
.table-row {
  display: flex;
  align-items: center;
}

.table-header {
  background-color: rgba(0, 0, 0, 0.05);
  font-weight: bold;
}

.table-row {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.table-cell {
  flex: 1;
  text-align: center;
  padding: $spacing-sm;
  font-size: $font-sm;
  color: $text-primary;
}

.table-note {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-sm;
  color: $text-secondary;
  font-style: italic;
}

// 技巧样式
.tip-group {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  border-radius: $radius-medium;
}

.tip-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-sm;
}

.tip-item {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.8;
  display: block;
  padding-left: $spacing-sm;
  margin-bottom: $spacing-xs;
}

// 角色详解样式
.section-subtitle {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  display: block;
  margin: 10px 0;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);

  &:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
}

.role-detail {
  display: flex;
  gap: $spacing-md;
  margin-bottom: 24px;
  border-radius: $radius-medium;
}

.role-avatar {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: $radius-small;
}

.role-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.role-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.role-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
}

.role-loyalty {
  font-size: $font-sm;
  padding: 2px 6px;
  border-radius: $radius-small;

  &.good-tag {
    color: $loyalty-good;
    background-color: rgba(33, 150, 243, 0.1);
  }

  &.evil-tag {
    color: $loyalty-evil;
    background-color: rgba(244, 67, 54, 0.1);
  }

  &.neutral-tag {
    color: $primary;
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.role-description {
  font-size: $font-md;
  color: $text-secondary;
  line-height: 1.7;
  display: block;
}

.role-tips {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: $spacing-xs;
}

.tips-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 2px;
}

.tips-item {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.6;
  padding-left: $spacing-xs;
}
</style>
