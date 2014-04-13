class GameAuthorizer < ApplicationAuthorizer
  def readable_by?(user)
    in_game?(user)
  end

  def opponent_setup_readable_by?(user)
    resource.action == 'play' && in_game?(user)
  end

  def abortable_by?(user)
    resource.action == 'setup' && in_game?(user)
  end

  def ply_creatable_by?(user)
    resource.action == 'play' && action_to?(user)
  end

  def resignable_by?(user)
    resource.action == 'play' && in_game?(user)
  end

  def setupable_by?(user)
    resource.action == 'setup' && in_game?(user)
  end

  private

  def in_game?(user)
    resource.alabaster_id == user.id || resource.onyx_id == user.id
  end

  def action_to?(user)
    resource.action_to_id == user.id
  end
end