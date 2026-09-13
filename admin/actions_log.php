<!-- 
  Admin-Aktionen Log (optional, für Admin-Dashboard)
  Zeigt: Wer hat wann was bei welchem Team gemacht?
-->
<section>
  <h3>Admin-Aktionen (letzte 50)</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Zeit</th>
        <th>Admin</th>
        <th>Team</th>
        <th>Aktion</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      <?php
      $stmt = $pdo->query("
        SELECT aa.created_at, au.email, t.name as team_name, aa.action_type, aa.action_data
        FROM admin_actions aa
        JOIN admin_users au ON aa.admin_user_id = au.id
        JOIN teams t ON aa.team_id = t.id
        ORDER BY aa.created_at DESC
        LIMIT 50
      ");
      while ($row = $stmt->fetch(PDO::FETCH_ASSOC)):
        $details = $row['action_data'] ? json_decode($row['action_data'], true) : null;
      ?>
      <tr>
        <td><?= htmlspecialchars($row['created_at']) ?></td>
        <td><?= htmlspecialchars($row['email']) ?></td>
        <td><?= htmlspecialchars($row['team_name']) ?></td>
        <td><code><?= htmlspecialchars($row['action_type']) ?></code></td>
        <td>
          <?php if ($details): ?>
            <?php foreach ($details as $key => $value): ?>
              <small><strong><?= htmlspecialchars($key) ?>:</strong> <?= htmlspecialchars($value) ?></small><br>
            <?php endforeach; ?>
          <?php else: ?>
            -
          <?php endif; ?>
        </td>
      </tr>
      <?php endwhile; ?>
    </tbody>
  </table>
</section>
