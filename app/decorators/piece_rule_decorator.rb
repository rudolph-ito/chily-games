class PieceRuleDecorator < Draper::Decorator
  delegate_all

  def capture_description
    'capture ' + if range_capture?
      'by range: ' + Messages.type_with_range(object, 'range')
    else
      'by movement'
    end
  end

  def movement_description
    'movement: ' + Messages.type_with_range(object, 'movement')
  end

  def range_capture_restriction
    prefix = if move_and_range_capture? then 'can' else 'cannot' end
    prefix + ' move and capture on the same turn'
  end

end
