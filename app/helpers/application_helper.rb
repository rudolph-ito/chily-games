module ApplicationHelper

  def italicize_cyvasse(str)
    str.gsub(/([Cc]yvasse)/) { |s| "<em>#{s}</em>" } .html_safe
  end

end
