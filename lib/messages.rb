class Messages

  def self.type_with_range(object, type)
    "#{object["#{type}_type"].humanize} - #{Messages.range(object, type)} space(s)"
  end

  def self.range(object, type)
    min = object.public_send "#{type}_minimum"
    max = object.public_send "#{type}_maximum"

    min.to_s + if max.blank?
      ' or more'
    elsif min.to_i < max.to_i
      ' to ' + max.to_s
    else
      ''
    end
  end

  def self.count_with_name(count, name)
    name = name.pluralize if count.to_i != 1
    "#{count} #{name}"
  end

end
