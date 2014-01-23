class GameAuthorizer < ApplicationAuthorizer
  def readable_by?(user)
    in_game?(user)
  end

  def opponent_setup_readable_by?(user)
    resource.action == 'move' && in_game?(user)
  end

  def abortable_by?(user)
    resource.action == 'setup' && in_game?(user)
  end

  def moveable_by?(user)
    resource.action == 'move' && action_to?(user)
  end

  def resignable_by?(user)
    ['attack', 'move'].include?(resource.action) && in_game?(user)
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